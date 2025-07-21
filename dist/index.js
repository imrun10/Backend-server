"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const DebugController_1 = require("./Controllers/DebugController");
const TextController_1 = require("./Controllers/TextController");
function buildApp() {
    // Sets up a Fastify instance similiar to express but much faster with built-in support for async/await
    const fastify = (0, fastify_1.default)();
    // controllers are self contained and handle their own routes
    // this allows for better separation of concerns and easier testing
    // playground controller to do different things and can be used for testing as well  
    let debugController = new DebugController_1.DebugController(fastify);
    let textController = new TextController_1.TextController(fastify);
    return fastify;
}
