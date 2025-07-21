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
exports.TextController = void 0;
// Now create a class that handles all text-related operations
class TextController {
    constructor(fastifyInstance) {
        this.fastify = fastifyInstance;
        // auto register routes
        this.registerRoutes();
        console.log('TextController initialized with Fastify instance');
    }
    registerRoutes() {
        // remember to follow good RESTful practices when defining routes
        this.fastify.post('/text', this.recieveText.bind(this));
    }
    recieveText(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            // this won;t work it depends on how twilio send the request so we need to check
            //const { body, id, from, valid, error }: textInterface = request.body as textInterface;
            let tempRequest = request.body;
            ;
            const tempInterface = {
                body: tempRequest.body,
                id: 'temp-id', // this should be replaced with actual id logic
                from: tempRequest.from, // this should be replaced with actual from logic
                valid: true, // this should be replaced with actual validation logic
                error: undefined // this should be replaced with actual error handling logic
            };
            // then we can call handleText to process the text
            //let response = await this.handleText(tempInterface);
            console.log('Received text:', tempInterface.body, 'From:', tempInterface.from);
            if (!tempInterface.valid) {
                return reply.status(400).send({ error: tempInterface.error || 'Invalid text' });
            }
            // Process the text here (e.g., save to database, send a response, etc.)
            reply.send({ message: `Text received from ${tempInterface.from}: ${tempInterface.body}` });
        });
    }
    // this should be public to allow other controllers to access it if needed eg /voice will need to access this after it inscribes the text
    handleText(text) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Handling text:', text.body, 'From:', text.from);
            if (!text.valid) {
                throw new Error(text.error || 'Invalid text');
            }
            // Process the text here (e.g., save to database, send a response, etc.)
            return { message: `Text handled from ${text.from}: ${text.body}` };
        });
    }
}
exports.TextController = TextController;
