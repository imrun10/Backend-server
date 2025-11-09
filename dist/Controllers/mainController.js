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
exports.MainController = void 0;
const memoryController_1 = require("./memoryController");
class MainController {
    constructor(fastifyInstance, _textController, _debugController, aiController) {
        this.fastify = fastifyInstance;
        this.aiController = aiController;
        this.registerRoutes();
    }
    registerRoutes() {
        this.fastify.post('/', this.handleRequest.bind(this));
    }
    handleRequest(request, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            console.log('Handling request');
            const input = request.body;
            let Body = ((_a = input === null || input === void 0 ? void 0 : input.Body) !== null && _a !== void 0 ? _a : "").toString();
            const From = ((_b = input === null || input === void 0 ? void 0 : input.WaId) !== null && _b !== void 0 ? _b : "").toString(); // E.164 phone expected by your DB
            const Name = ((_c = input === null || input === void 0 ? void 0 : input.ProfileName) !== null && _c !== void 0 ? _c : "Unknown").toString();
            if (!Body || !From) {
                reply.status(400).send('Missing message or sender info');
                return;
            }
            const mainBody = { Name, body: Body };
            const language = 'English'; // default; AI will switch if needed
            try {
                // Path A: existing user
                const exists = yield memoryController_1.MemoryController.rememberUser(From);
                if (exists) {
                    // load long context (profile) + short-term memory is handled inside AIController
                    const result = yield this.aiController.handleMessage(mainBody, From, language, exists !== null && exists !== void 0 ? exists : undefined);
                    reply
                        .type('text/xml')
                        .send(`<Response><Message>${result.body}</Message></Response>`);
                    return;
                }
                // Path B: onboarding new user (Hausa)
                // Load or initialize onboarding record
                // Fist check the last question asked
                const lastQ = yield memoryController_1.MemoryController.getOnboardingState(From);
                if (!lastQ) {
                    // Start onboarding
                    const firstQ = yield memoryController_1.MemoryController.onboardingNextquestion(From);
                    console.log('Starting onboarding, asking first question:', firstQ);
                    reply.type('text/xml').send(`<Response><Message>${firstQ}</Message></Response>`);
                    return;
                }
                // check theanswer with AI then update the record
                console.log('Validating onboarding answer for question:', lastQ, 'with answer:', Body);
                const valid = yield this.aiController.validateOnboardingAnswer({
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
                const ob = yield memoryController_1.MemoryController.setOnboarding(From, lastQ, Body);
                // CHECK IF DONE
                const notDone = yield memoryController_1.MemoryController.getOnboardingState(From);
                if (notDone === 'DONE') {
                    // Done already saved to db so reply with welcome message + next steps
                    const WelcomeMessage = 'Welcome! ask any question about farming and use whatever language you like. / Barka da zuwa! Yi tambaya game da noma a cikin harshen da kake so.';
                    reply.type('text/xml').send(`<Response><Message>${WelcomeMessage}</Message></Response>`);
                    return;
                }
                else {
                    // Not done, ask next question
                    const nextQ = yield memoryController_1.MemoryController.onboardingNextquestion(From);
                    console.log('Onboarding not done, asking next question:', nextQ);
                    reply.type('text/xml').send(`<Response><Message>${nextQ}</Message></Response>`);
                    return;
                }
            }
            catch (err) {
                console.error('Error in main flow:', err);
                reply
                    .type('text/xml')
                    .send(`<Response><Message>language: en Name: Bot body: Sorry, something went wrong. Please try again.</Message></Response>`);
            }
        });
    }
}
exports.MainController = MainController;
