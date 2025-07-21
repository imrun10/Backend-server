
// create a deug controller similiar to TextController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import Fastify from 'fastify';
import { textInterface } from '../Model/interfaces';

// DebugController handles debugging operations
export class DebugController {
    private fastify: any;

    constructor(fastifyInstance: any) {
        this.fastify = fastifyInstance;
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.post('/debug', this.handleDebug.bind(this));
    }

    private async handleDebug(request: FastifyRequest, reply: FastifyReply) {
        const { body, id, from, valid, error }: textInterface = request.body as textInterface;

        console.log('Debugging text:', body, 'From:', from);

        if (!valid) {
            return reply.status(400).send({ error: error || 'Invalid debug text' });
        }

        // Process the debug text here (e.g., log to console, send a response, etc.)
        
        reply.send({ message: `Debug text received from ${from}: ${body}` });
    }
}