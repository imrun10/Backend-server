"use strict";
// src/Controllers/AIController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const openai_1 = __importDefault(require("openai"));
const memoryController_1 = require("./memoryController");
class AIController {
    constructor(apiKey) {
        this.client = new openai_1.default({ apiKey });
    }
    handleMessage(raw, phoneNumber, lang) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            let language;
            let name;
            let body;
            language = lang;
            name = raw.Name || "Unknown";
            body = raw.body || "";
            yield memoryController_1.MemoryController.saveShortTermMemory(phoneNumber, {
                language,
                name,
                lastBody: body,
            });
            // Re-fetch memory history after saving new entry
            const memoryArray = yield memoryController_1.MemoryController.loadShortTermMemory(phoneNumber);
            const historyHint = (memoryArray === null || memoryArray === void 0 ? void 0 : memoryArray.length)
                ? memoryArray
                    .map((m, i) => `Message ${i + 1} from ${m.name}: "${m.lastBody}"`)
                    .join("\n")
                : "No previous messages found.";
            console.log(`Memory for ${phoneNumber}:`, memoryArray);
            const systemPrompt = `
You are a warm but professional agricultural advisor for farmers.

Instructions you must follow strictly:

- You only respond in the **language used in the user's most recent message**.
- You only answer **farming-related questions**.
- If the user sends an off-topic message, you do not answer it. Instead, gently guide them back to farming questions. Mention their name warmly when nudging them.
- You never use emojis, slang, or informal tone. Stay helpful and encouraging.
- You always refer to the user by name to make them feel seen and respected.
- You only accept and respond to messages in the format: language:... Name:... body:...
- If the format is incorrect, explain the correct format and ask them to try again.
- You do not remember your past responses — only the user's messages.
- You must **estimate what you would have said** based on the user's previous messages.
- you must know that you already responded so do no keep repeating the same introduction like hey [name] etc etc
- You must **continue the conversation** as if you had responded last time.
- if someone asks to change language, you must change the language and remember it for next time
- if the user starts speaking in a different language, you must switch to that language immediately

Here is the full message history from the user:

${historyHint}

Remember, the user you're speaking to is:
- Name: ${name}
- Phone number: ${phoneNumber}


Make sure your reply:
- Uses the exact message format above
- make sure you update the language and name if the user requests a change or if you detect a change in language
- Uses the most recent language
- Continues the conversation as if you had responded last time
`;
            console.log(historyHint);
            const response = yield this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `language: ${language} Name: ${name} body: ${body}`,
                    },
                ],
                temperature: 0.3,
            });
            const reply = (_d = (_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
            console.log("AI response:", reply);
            if (!reply) {
                throw new Error("OpenAI returned no reply");
            }
            const parsed = reply.match(/^language\s*:\s*(\S+)\s+Name\s*:\s*([\s\S]+?)\s+body\s*:\s*([\s\S]+)$/i);
            if (!parsed) {
                throw new Error("Response is not in correct format");
            }
            return {
                language: parsed[1],
                name: parsed[2],
                body: parsed[3],
            };
        });
    }
}
exports.AIController = AIController;
