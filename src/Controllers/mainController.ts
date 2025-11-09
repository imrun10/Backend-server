// src/Controllers/mainController.ts
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { DebugController } from './DebugController';
import { TextController } from './TextController';
import { AIController } from './AIController';
import { MemoryController } from './memoryController';
import { checkIfExists } from './database/utility';

export type MainBody = { Name: string; body: string };

export class MainController {
  private fastify: FastifyInstance;
  private aiController: AIController;

  constructor(fastifyInstance: FastifyInstance, _textController: TextController, _debugController: DebugController, aiController: AIController) {
    this.fastify = fastifyInstance;
    this.aiController = aiController;
    this.registerRoutes();
  }

  private registerRoutes() {
    this.fastify.post('/', this.handleRequest.bind(this));
  }

  private async handleRequest(request: FastifyRequest, reply: FastifyReply) {
    console.log('Handling request');
    const input = request.body as any;
    let Body = (input?.Body ?? "").toString();
    const From = (input?.WaId ?? "").toString();          // E.164 phone expected by your DB
    const Name = (input?.ProfileName ?? "Unknown").toString();

    if (!Body || !From) {
      reply.status(400).send('Missing message or sender info');
      return;
    }

    const mainBody: MainBody = { Name, body: Body };
    const language = 'English'; // default; AI will switch if needed

    try {
      // Path A: existing user
      const exists = await MemoryController.rememberUser(From); 
      if (exists) {
        // load long context (profile) + short-term memory is handled inside AIController
        const result = await this.aiController.handleMessage(mainBody, From, language, exists ?? undefined);
        reply
          .type('text/xml')
          .send(`<Response><Message>${result.body}</Message></Response>`);
        return;
      }

      // Path B: onboarding new user (Hausa)
      // Load or initialize onboarding record
      // Fist check the last question asked
      const lastQ = await MemoryController.getOnboardingState(From)
      if (!lastQ) {
        // Start onboarding
        const firstQ = await MemoryController.onboardingNextquestion(From);
        console.log('Starting onboarding, asking first question:', firstQ);
        reply.type('text/xml').send(`<Response><Message>${firstQ}</Message></Response>`);
        return;
      }
      
      // check theanswer with AI then update the record
      console.log('Validating onboarding answer for question:', lastQ, 'with answer:', Body);
      const valid = await this.aiController.validateOnboardingAnswer({
        questionKey: lastQ,
        answer: Body,
      });
      console.log('Onboarding answer validation result:', valid); 
      // if the aswer is undefied or false, ask to re-answer
      if (valid === undefined || !valid[0]) {
        // AI could not validate, ask to re-answer
        const prompt = `Answer properly?/ Ka amsa daidai? `;
        reply.type('text/xml').send(`<Response><Message>${prompt}</Message></Response>`);
        return;
      }
      if (valid[1] && lastQ === 'state') {
        Body = valid[1]; // corrected state name from AI
      }

      // if true, update the record and check if onboarding is complete
      const ob = await MemoryController.setOnboarding(From, lastQ, Body);

      // CHECK IF DONE
      const notDone = await MemoryController.getOnboardingState(From);
      if (notDone === 'DONE') {
        // Done already saved to db so reply with welcome message + next steps
        const WelcomeMessage = 'Welcome! ask any question about farming and use whatever language you like. / Barka da zuwa! Yi tambaya game da noma a cikin harshen da kake so.';
        reply.type('text/xml').send(`<Response><Message>${WelcomeMessage}</Message></Response>`);
        return;

      } else {
        // Not done, ask next question
        const nextQ = await MemoryController.onboardingNextquestion(From);
        console.log('Onboarding not done, asking next question:', nextQ);
        reply.type('text/xml').send(`<Response><Message>${nextQ}</Message></Response>`);
        return;
      }

    } catch (err: any) {
      console.error('Error in main flow:', err);
      reply
        .type('text/xml')
        .send(`<Response><Message>language: en Name: Bot body: Sorry, something went wrong. Please try again.</Message></Response>`);
    }
  }
}
