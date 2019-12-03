"use strict";

const ApiGateway = require("moleculer-web");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [{
			path: "/api",
			authorization:true,

			aliases:{
				//Create
				"POST /users/create":"users.create",

				//login
				"POST /users/login":"users.login",

				//update
				"PUT /users/updateUser": "users.updateUser",

				//Find by email
                "GET /users/getUser":"users.getUser",

				//forgot Password
				"PUT /users/forgotPassword":"users.forgotPassword",

				//Delete user
				"DELETE /users/delete": "users.delete"
			}

		}],

		// Serve assets from "public" folder
		assets: {
			folder: "public"
		}
	}
};
