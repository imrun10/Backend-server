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
exports.DebugController = void 0;
// DebugController handles debugging operations
class DebugController {
    constructor(fastifyInstance) {
        this.fastify = fastifyInstance;
        this.registerRoutes();
    }
    registerRoutes() {
        this.fastify.post('/debug', this.handleDebug.bind(this));
    }
    handleDebug(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body, id, from, valid, error } = request.body;
            console.log('Debugging text:', body, 'From:', from);
            if (!valid) {
                return reply.status(400).send({ error: error || 'Invalid debug text' });
            }
            // Process the debug text here (e.g., log to console, send a response, etc.)
            reply.send({ message: `Debug text received from ${from}: ${body}` });
        });
    }
}
exports.DebugController = DebugController;
