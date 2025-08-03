// src/Controllers/mainController.ts

import { FastifyRequest, FastifyReply } from 'fastify';
import { FastifyInstance } from 'fastify';
import { DebugController } from './DebugController';
import { TextController } from './TextController';
import { AIController } from './AIController';

export type MainBody = {
    Name: string,
    body: string;
}
export class MainController {
  private fastify: FastifyInstance;
  private aiController: AIController;

  constructor(
    fastifyInstance: FastifyInstance,
    textController: TextController,
    debugController: DebugController,
    aiController: AIController
  ) {
    this.fastify = fastifyInstance;
    this.aiController = aiController;
    this.registerRoutes();
  }

  private registerRoutes() {
    this.fastify.post('/', this.handleRequest.bind(this));
  }

  private async handleRequest(request: FastifyRequest, reply: FastifyReply) {
    console.log('Handling request');
    let input = request.body as any;
    const Body = input.Body as string;
    const From = input.WaId as string;
    const Name = input.ProfileName as string;
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
      const result = await this.aiController.handleMessage(mainBody, From, language);
      console.log(`AI returned:\n${JSON.stringify(result, null, 2)}`);

      // Send only the response body to Twilio
      reply
        .type('text/xml')
        .send(`<Response><Message>${result.body}</Message></Response>`);
    } catch (err: any) {
      console.error('Error in AI handling:', err);
      reply
        .type('text/xml')
        .send(`<Response><Message>language: en Name: Bot body: Sorry, something went wrong. Make sure your message is in the correct format.</Message></Response>`);
    }
  }
}
