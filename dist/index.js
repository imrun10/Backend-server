"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const DebugController_1 = require("./Controllers/DebugController");
const TextController_1 = require("./Controllers/TextController");
const formbody_1 = __importDefault(require("@fastify/formbody"));
function buildApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const fastify = (0, fastify_1.default)();
        yield fastify.register(formbody_1.default); // <== THIS IS KEY 🗝️
        new DebugController_1.DebugController(fastify);
        new TextController_1.TextController(fastify);
        return fastify;
    });
}
