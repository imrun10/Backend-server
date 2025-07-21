import { FastifyRequest, FastifyReply } from 'fastify';
import Fastify from 'fastify';
import { textInterface } from '../Model/interfaces';



// Now create a class that handles all text-related operations
export class TextController {
    private fastify: any;
    
    constructor(fastifyInstance: any) {
        this.fastify = fastifyInstance;
        this.registerRoutes();
    }
    
    private registerRoutes() {
        this.fastify.post('/text', this.handleText.bind(this));
    }
    
    private async handleText(request: FastifyRequest, reply: FastifyReply) {
        const { body, id, from, valid, error }: textInterface = request.body as textInterface;
    
        console.log('Received text:', body, 'From:', from);
    
        if (!valid) {
        return reply.status(400).send({ error: error || 'Invalid text' });
        }
    
        // Process the text here (e.g., save to database, send a response, etc.)
        
        reply.send({ message: `Text received from ${from}: ${body}` });
    }
    }
