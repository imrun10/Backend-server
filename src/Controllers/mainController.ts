
import { FastifyRequest, FastifyReply } from 'fastify';
import Fastify from 'fastify';
import { textInterface } from '../Model/interfaces';



// Now we create the class that manages all relation
export class mainController {
    private fastify: any;
    
    constructor(fastifyInstance: any) {
        this.fastify = fastifyInstance;
        // auto register routes
        this.registerRoutes();
        console.log('TextController initialized with Fastify instance');
    }
    
    private registerRoutes() {
        // remember to follow good RESTful practices when defining routes
        this.fastify.post('/text', this.recieveText.bind(this));
    }
    
    private async recieveText(request: FastifyRequest, reply: FastifyReply) {
        // this won;t work it depends on how twilio send the request so we need to check
        //const { body, id, from, valid, error }: textInterface = request.body as textInterface;

    
        let tempRequest = request.body as any;
;
        const tempInterface: textInterface = {
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
    }

    // this should be public to allow other controllers to access it if needed eg /voice will need to access this after it inscribes the text
    public async handleText(text: textInterface): Promise<{ message: string }> {
        console.log('Handling text:', text.body, 'From:', text.from);
        
        if (!text.valid) {
            throw new Error(text.error || 'Invalid text');
        }
        
        // Process the text here (e.g., save to database, send a response, etc.)
        
        return { message: `Text handled from ${text.from}: ${text.body}` };
    }
}