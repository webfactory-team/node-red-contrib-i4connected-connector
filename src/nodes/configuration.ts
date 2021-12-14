import "reflect-metadata";
export = function (RED) {
    "use strict";

    function Configuration(n) {
        RED.nodes.createNode(this, n);
        this.api = n.api;
        this.identity = n.identity;

        if (this.credentials && this.credentials.hasOwnProperty("password")) {
            this.password = this.credentials.password;
        }

        if (this.credentials && this.credentials.hasOwnProperty("username")) {
            this.username = this.credentials.username;
        }

        if (this.credentials && this.credentials.hasOwnProperty("clientId")) {
            this.clientId = this.credentials.clientId;
        }

        if (this.credentials && this.credentials.hasOwnProperty("clientSecret")) {
            this.clientSecret = this.credentials.clientSecret;
        }

        if (this.credentials && this.credentials.hasOwnProperty("scope")) {
            this.scope = this.credentials.scope;
        }

        RED.nodes.addCredentials(n.id,
            {
                username: this.username,
                password: this.password,
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                scope: this.scope, 
                global: true
            });
    }

    RED.nodes.registerType("configuration", Configuration, {
        credentials: {
            username: { type: "text" },
            password: { type: "password" },
            clientId: { type: "text" },
            clientSecret: { type: "password" },
            scope: { type: "text" },
        }
    });
};