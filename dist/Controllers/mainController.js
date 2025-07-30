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
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainController = void 0;
const ai_1 = require("../utils/ai");
// Now we create the class that manages all related controllers
class mainController {
    constructor(fastifyInstance, textController, debugController) {
        this.fastify = fastifyInstance;
        this.registerRoutes();
    }
    registerRoutes() {
        // All messages will hit this route
        this.fastify.post('/', this.handleRequest.bind(this));
    }
    handleRequest(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling request');
            const { Body, From } = request.body;
            console.log('Request details:', request.body);
            console.log(`Message received from ${From}: ${Body}`);
            let tempRequest = request.body;
            let message = tempRequest.body;
            console.log('Message:', message);
            if (!message) {
                message = Body;
            }
            const aiReply = yield (0, ai_1.getAIResponse)(message);
            console.log('AI Reply:', aiReply);
            reply
                .type('text/xml')
                .send(`<Response><Message>${aiReply}</Message></Response>`);
        });
    }
}
exports.mainController = mainController;
