import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyInstance } from 'fastify';
import formbody from '@fastify/formbody'; // You MUST register this somewhere in your app

export class DebugController {
    private fastify: FastifyInstance;

    constructor(fastifyInstance: FastifyInstance) {
        this.fastify = fastifyInstance;
        this.registerRoutes();
    }

    private registerRoutes() {
        this.fastify.post('/', this.handleDebug.bind(this));
    }

    private async handleDebug(request: FastifyRequest, reply: FastifyReply) {
        console.log('Debug');
        const { Body, From } = request.body as { Body: string; From: string };

        console.log('Debugging request:', request.body);
        console.log(`Message received from ${From}: ${Body}`);

        reply
            .type('text/xml')
            .send(`<Response><Message>You said: ${Body}</Message></Response>`);
    }
}
