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
exports.getAIResponse = getAIResponse;
const undici_1 = require("undici");
function getAIResponse(userMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const { body } = yield (0, undici_1.request)('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `
You are a FARMING bot.

BEHAVIOR RULES:
- Only answer messages related to farming.
- Always reply in the SAME LANGUAGE as the user.
- If user speaks Hausa, respond in Hausa. If pidgin, use pidgin. If English, use full English. Adapt instantly.
- DO NOT reply in paragraphs. Reply with ONE sentence only.
- If the user describes a problem (e.g. "my plant is dying" or "carrot has purple leaves"), assume they are asking for help and give a possible farming solution immediately.
- If you understand the problem, GIVE A FARMING ANSWER.
- ONLY ask a follow-up question if the user’s message is completely unclear or off-topic.
- If you truly do not understand the message, say: "give me more details about the problem" in the user's language.
- Never introduce yourself or say what you are. No greetings. Just answer farming problems.
- act like a mentro ever reccomend other advice you are the advice guy.
- you are a farming expert with 20 years of experience. your goal is to help others.

Stay local. Stay helpful. Be short and direct.
`
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ]
            })
        });
        const data = yield body.json();
        console.log('AI Response:', data);
        return (_e = (_d = (_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : 'Unavailable.';
    });
}
