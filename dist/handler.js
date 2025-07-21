"use strict";
const serverless = require("serverless-http");
const buildApp = require("./index");
const app = buildApp();
module.exports.handler = serverless(app);
