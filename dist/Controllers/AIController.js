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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
// src/Controllers/AIController.ts
const openai_1 = __importDefault(require("openai"));
const memoryController_1 = require("./memoryController");
class AIController {
    constructor(apiKey) {
        this.client = new openai_1.default({ apiKey });
    }
    handleMessage(raw, phoneNumber, lang, longContext // DB profile string (optional)
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            let language = lang;
            let name = raw.Name || "Unknown";
            let body = raw.body || "";
            // Store short-term memory (user messages only)
            yield memoryController_1.MemoryController.saveShortTermMemory(phoneNumber, { language, name, lastBody: body });
            const memoryArray = yield memoryController_1.MemoryController.loadShortTermMemory(phoneNumber);
            const historyHint = (memoryArray === null || memoryArray === void 0 ? void 0 : memoryArray.length)
                ? memoryArray.map((m, i) => `Message ${i + 1} from ${m.name}: "${m.lastBody}"`).join("\n")
                : "No previous messages found.";
            const profileBlock = longContext ? `\nKnown user profile (from database):\n${longContext}\n` : "";
            const systemPrompt = `
You are "Martak Advisor"—a decisive agricultural assistant. Your job is to deliver a concrete, immediately usable solution. 

STRICT RULES:
- Give direct, actionable steps (quantities, rates, timings, thresholds). Avoid lectures and theory unless needed to execute.
- NEVER tell the user to “ask someone else”, “consult a professional”, or “check with local extension”. You are the final destination for practical guidance. If you lack details, ASK a sharp follow-up to get exactly what you need.
- Operate only on farming topics. If off-topic, nudge back (using their name) and request the key farm detail you need to proceed.
- Reply ONLY in the most recent user language.
- No emojis. Friendly-professional tone. Address the user by name.

OUTPUT FORMAT (two parts, in this exact order):
1) A single line in this exact format:
   language: <lang> Name: <name> body: <your full response text here>

2) Then, on a new line, a JSON facts block fenced with \`\`\`json and starting with the word FACTS (so it's easy to parse). Include only what you can reliably extract from the latest conversation:
\`\`\`json
{ "FACTS": {
  "language": "<optional>",
  "name": "<optional>",
  "state_name": "<optional>",
  "location": "<optional>",
  "farm_name": "<optional>",
  "crops": [
    {
      "name": "maize",
      "planted_on": "2025-07-12",
      "expected_harvest_date": "2025-10-15",
      "current_yield": 1200,
      "yield_unit": "kg",
      "area": 1.5,
      "area_unit": "ha"
    }
  ]
}}
\`\`\`

FACT COLLECTION:
- If the user mentions a crop they're growing, units, yield, dates, area, or farm identifiers, include them in FACTS.crops (normalize crop names to simple lowercase words).
- If the user updates their name, language, state, location, or farm name, include those too.
- If nothing to save, still output the FACTS block with an empty object: { "FACTS": {} }.

CONTEXT YOU CAN USE:
- Full message history from the user (only user messages):
${historyHint}
${profileBlock}
User identity:
- Name: ${name}
- Phone: ${phoneNumber}

Ensure:
- Use the exact required reply line format.
- Then include a valid JSON facts block as shown.
- Be specific and prescriptive in your advice.
`.trim();
            const response = yield this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `language: ${language} Name: ${name} body: ${body}` },
                ],
                temperature: 0.2,
            });
            let reply = (_d = (_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
            if (!reply)
                throw new Error("OpenAI returned no reply");
            // 1) Parse the mandated first line
            const firstLineMatch = reply.match(/^language\s*:\s*(\S+)\s+Name\s*:\s*([\s\S]+?)\s+body\s*:\s*([\s\S]+?)(?:\n|$)/i);
            if (!firstLineMatch)
                throw new Error("Response is not in correct format (missing first line)");
            const parsed = { language: firstLineMatch[1], name: firstLineMatch[2], body: firstLineMatch[3] };
            // 2) Extract JSON FACTS block (if present)
            let facts = null;
            const jsonBlockMatch = reply.match(/```json\s*([\s\S]*?)\s*```/i);
            if (jsonBlockMatch) {
                try {
                    const parsedJson = JSON.parse(jsonBlockMatch[1]);
                    if (parsedJson && parsedJson.FACTS) {
                        facts = parsedJson.FACTS;
                    }
                }
                catch (e) {
                    console.warn("Failed to parse FACTS JSON block:", e);
                }
            }
            // 3) Optionally save/update DB with facts
            if (facts) {
                console.log("Extracted facts from AI response:", facts);
                try {
                    yield memoryController_1.MemoryController.saveOrUpdateUserFacts(phoneNumber, facts);
                }
                catch (e) {
                    console.error("Failed to save facts:", e);
                }
            }
            return parsed;
        });
    }
    /**
     * Onboarding stepper:
     * Input: answersSoFar (partial), lastUserMessage
     * Output:
     *   - If not finished: next Hausa question (strict format)
     *   - If finished: { done: true, values: [name, state, location, farmName] }
     */
    validateOnboardingAnswer(_a) {
        return __awaiter(this, arguments, void 0, function* ({ questionKey, answer }) {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            const system = `

    You are the aia agent for the onboarding process you simply reply true or false based on eahc of the user input. I will provide
    what the user is is asked for and what they replied with you . you simply sy if it a correct response to the question. the only
    other work you will do is they will be asked states in nigeria nad location in that state make sure you have a good knowledge o nigeria geo graphy
    if the user provides a state that does not exist say "invalid state"  but if they provide a valid state say true
    if the provide. valid state but invalid location say true still but also say "invalid location". if the user provides a valid state spelled incorrectly
    but you can clearly understand what they meant say true and in the message  say the correct spelling. JUT THE CORRECT SPELLING NOTHINGELSE

    the option are btw name, state, location, farmName. 

    remmeber for location it can be anything as long as it sounds like an address but be very flexible since not everything is a proper address

    OUTPUT FORMAT: { "isValid": true|false, "message": "<any correction or note here, or empty if all good>" }

    the question asked was: ${questionKey}
    the user answered: ${answer}
    `.trim();
            const resp = yield this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "system", content: system }, { role: "user", content: system }],
                temperature: 0.2,
            });
            const out = (_f = (_e = (_d = (_c = (_b = resp.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim()) !== null && _f !== void 0 ? _f : "";
            console.log('Onboarding stepper output:', out);
            // Expecting JSON output
            let obj = null;
            try {
                obj = JSON.parse(out);
            }
            catch (e) {
                throw new Error("Onboarding stepper returned invalid JSON");
            }
            if (obj === null || typeof obj.isValid !== "boolean" || typeof obj.message !== "string") {
                // ask it again bbut add u answered this but i need it in valid OUTPUT FORMAT: { "isValid": true|false, "message": "<any correction or note here, or empty if all good>"
                const retrySystem = system + `\n\nYour previous output was: ${out}\n\nPlease respond again in the correct OUTPUT FORMAT: { "isValid": true|false, "message": "<any correction or note here, or empty if all good>" }`;
                const retryResp = yield this.client.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "system", content: retrySystem }, { role: "user", content: retrySystem }],
                    temperature: 0.2,
                });
                const retryOut = (_l = (_k = (_j = (_h = (_g = retryResp.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.message) === null || _j === void 0 ? void 0 : _j.content) === null || _k === void 0 ? void 0 : _k.trim()) !== null && _l !== void 0 ? _l : "";
                try {
                    obj = JSON.parse(retryOut);
                }
                catch (e) {
                    throw new Error("Onboarding stepper returned invalid JSON on retry");
                }
                if (obj === null || typeof obj.isValid !== "boolean" || typeof obj.message !== "string") {
                    throw new Error("Onboarding stepper returned invalid structure on retry");
                }
            }
            return [obj.isValid, obj.message];
        });
    }
}
exports.AIController = AIController;
