
import { FastifyRequest, FastifyReply } from 'fastify';
import Fastify from 'fastify';
import { FastifyInstance } from 'fastify';
import { textInterface } from '../Model/interfaces';
import { DebugController } from './DebugController';
import { TextController } from './TextController';
import { getAIResponse } from '../utils/ai';




// Now we create the class that manages all related controllers


export class mainController {
     private fastify: FastifyInstance;
    
        constructor(fastifyInstance: FastifyInstance, textController: TextController, debugController: DebugController) {
            this.fastify = fastifyInstance;
            this.registerRoutes();
        }
    
        private registerRoutes() {
            // All messages will hit this route
            this.fastify.post('/', this.handleRequest.bind(this));
        }


private async handleRequest(request: FastifyRequest, reply: FastifyReply) {
    console.log('Handling request');
    const { Body, From } = request.body as { Body: string; From: string };

    console.log('Request details:', request.body);
    console.log(`Message received from ${From}: ${Body}`);

    let tempRequest = request.body as any;
    let message = tempRequest.body;
    console.log('Message:', message);
    if (!message) {
       message = Body
    }

    const aiReply = await getAIResponse(message);
    console.log('AI Reply:', aiReply);

    reply
        .type('text/xml')
        .send(`<Response><Message>${aiReply}</Message></Response>`);
}

}