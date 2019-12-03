"use strict";

const { MoleculerClientError } =require("moleculer").Errors;
const bcrypt = require("bcrypt");
const jwt =require("jsonwebtoken");
const DbService =require("../sakhadb/db.sakha.js");


module.exports = {
    name:"users",
    mixins: [DbService("users")],



   settings: {
       /** Secret for JWT */
       JWT_SECRET: process.env.JWT_SECRET || "jwt-conduit-secret",

       /** Public fields */
       fields: ["_id", "username", "email","phone"],

       /** Validator schema for entity */
       entityValidator: {
           username: { type: "string", min: 2, pattern: /^[a-zA-Z0-9]+$/ },
           password: { type: "string", min: 5 },
           email: { type: "email" },
           phone:{type:"number"},
          
       }
   },
   actions: {

    create: {
        params: {
            user: { type: "object" }
        },          
        handler(ctx) {
            let entity = ctx.params.user;
            return this.validateEntity(entity)
                .then(() => {
                    if (entity.username)
                        return this.adapter.findOne({ username: entity.username })
                            .then(found => {
                                if (found)
                                    return Promise.reject(new MoleculerClientError("Username is exist!", 422, "", [{ field: "username", message: "is exist"}]));
                                
                            });
                })
                .then(() => {
                    if (entity.email)
                        return this.adapter.findOne({ email: entity.email })
                            .then(found => {
                                if (found)
                                    return Promise.reject(new MoleculerClientError("Email is exist!", 422, "", [{ field: "email", message: "is exist"}]));
                            });
                        
                })
                .then(() => {
                    entity.password = bcrypt.hashSync(entity.password, 10);
                    entity.phone =(entity.phone);
                    entity.createdAt = new Date();

                    return this.adapter.insert(entity)
                        .then(doc => this.transformDocuments(ctx, {}, doc))
                        //.then(user => this.transformEntity(user, true, ctx.meta.token))
                        .then(json => this.entityChanged("created", json, ctx).then(() => json));                   
                });
        }
    },




    login: {
        params: {
            user: { type: "object", props: {
                email: { type: "email" },
                password: { type: "string", min: 1 }
            }}
        },
        handler(ctx) {
            const { email, password } = ctx.params.user;

            return this.Promise.resolve()
                .then(() => this.adapter.findOne({ email }))
                .then(user => {
                    if (!user)
                        return this.Promise.reject(new MoleculerClientError("Email or password is invalid!", 422, "", [{ field: "email", message: "is not found"}]));

                    return bcrypt.compare(password, user.password).then(res => {
                        if (!res)
                            return Promise.reject(new MoleculerClientError("Wrong password!", 422, "", [{ field: "email", message: "is not found"}]));
                        
                        // Transform user entity (remove password and all protected fields)
                        return this.transformDocuments(ctx, {}, user);
                    });
                })
                //.then(user => this.transformEntity(user, true, ctx.meta.token));
        }
    },


    delete:{
        params:{
            user:{type:"object",
                   props:{
                       email:"email"
                }}
        },
     handler(ctx){
         const{email}=ctx.params.user;
    
         return this.Promise.resolve()
           .then(()=>this.adapter.findOne({email}))
           .then(user => {
                 if(!user)
                 return this.Promise.reject(new MoleculerClientError("Email is invalid",422,"",[{field: "email",message:"is not found"}]));
           
                 return this.adapter.removeById(user._id)
        
                    .then(json => this.entityChanged("removed", json, ctx).then(() => json));
           });
     }
    
    },


    getUser:{
        params:{
        user:{type:"object"}
        },
        handler(ctx) {
            
        const { email} = ctx.params.user;
        
        return this.Promise.resolve()
        .then(() => this.adapter.findOne({ email }))
        .then((user)=>{
        if (!user)
        return this.Promise.reject(new MoleculerClientError("Email or password is invalid!", 422, "", [{ field: "email", message: "is not found"}]));
        
        return user;
        });
        }
    },


    updateUser:{
        params: {
            user: { type: "object", props: {
                username: { type: "string", min: 2, optional: true, pattern: /^[a-zA-Z0-9]+$/ },
                password: { type: "string", min: 5, optional: true },
                email: { type: "email", optional: true },
                phone:{type:"number",optional:true},
            }}
        },
        handler(ctx) {
        const newData = ctx.params.user; 
        const { email} = ctx.params.user;
        
        return this.Promise.resolve()
        .then(() => this.adapter.findOne({ email }))

        .then((user) => {
            newData.updatedAt = new Date();
            const update = {
                "$set": newData
            };

            return this.adapter.updateById(user._id,update)
                .then(doc => this.transformDocuments(ctx, {}, doc))
                .then(json => this.entityChanged("UPDATED", json, ctx).then(() => json));                   
        });

        }
    },
   
    forgotPassword:{
        params: {
            user: { type: "object", props: {
                username: { type: "string", min: 2, optional: true, pattern: /^[a-zA-Z0-9]+$/ },
                password: { type: "string", min: 5, optional: true },
                email: { type: "email", optional: true },
                phone:{type:"number",optional:true},
            }}
        },
        handler(ctx) {
        const newData = ctx.params.user; 
        const { password} = ctx.params.user;
        const { confirmPassword} = ctx.params.user;
        const { email} = ctx.params.user;
        
        return this.Promise.resolve()
        .then(() => this.adapter.findOne({ email }))

        .then((user) => {
            if(password === confirmPassword){
                newData.password = bcrypt.hashSync(password, 10);
                newData.updatedAt = new Date();
                const update = {
                    "$set": newData
                };
                return this.adapter.updateById(user._id,update)
                    .then(doc => this.transformDocuments(ctx, {}, doc))
                    .then(json => this.entityChanged("UPDATED", json, ctx).then(() => json)); 
        }
        });
        }
    },

   }

};