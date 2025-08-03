"use strict";
// src/Controllers/mainController.ts
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
exports.MainController = void 0;
class MainController {
    constructor(fastifyInstance, textController, debugController, aiController) {
        this.fastify = fastifyInstance;
        this.aiController = aiController;
        this.registerRoutes();
    }
    registerRoutes() {
        this.fastify.post('/', this.handleRequest.bind(this));
    }
    handleRequest(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling request');
            let input = request.body;
            const Body = input.Body;
            const From = input.WaId;
            const Name = input.ProfileName;
            const mainBody = {
                Name: Name || 'Unknown',
                body: Body || ''
            };
            if (!Body || !From) {
                reply.status(400).send('Missing message or sender info');
                return;
            }
            const language = 'English'; // Default language
            try {
                const result = yield this.aiController.handleMessage(mainBody, From, language);
                console.log(`AI returned:\n${JSON.stringify(result, null, 2)}`);
                // Send only the response body to Twilio
                reply
                    .type('text/xml')
                    .send(`<Response><Message>${result.body}</Message></Response>`);
            }
            catch (err) {
                console.error('Error in AI handling:', err);
                reply
                    .type('text/xml')
                    .send(`<Response><Message>language: en Name: Bot body: Sorry, something went wrong. Make sure your message is in the correct format.</Message></Response>`);
            }
        });
    }
}
exports.MainController = MainController;
