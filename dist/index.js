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
    const fastify = (0, fastify_1.default)();
    let debugController = new DebugController_1.DebugController(fastify);
    let textController = new TextController_1.TextController(fastify);
    return fastify;
}
