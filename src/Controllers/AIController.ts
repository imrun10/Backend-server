// src/Controllers/AIController.ts
import OpenAI from "openai";
import { MemoryController } from "./memoryController";
import { MainBody } from "./mainController";
import { schema } from "../.schema";

type FactsCrop = {
  name: string;                     // e.g., "maize"
  planted_on?: string;              // ISO date "2025-07-12"
  expected_harvest_date?: string;   // ISO date
  current_yield?: number;           // numeric value
  yield_unit?: string;              // e.g., "kg", "t"
  area?: number;                    // numeric area if user provided
  area_unit?: string;               // e.g., "ha", "ac"
};

type FactsPayload = {
  language?: string;
  name?: string;
  state_name?: string;
  location?: string;
  farm_name?: string;
  crops?: FactsCrop[];
};

export class AIController {
  private client: OpenAI;
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async handleMessage(
    raw: MainBody,
    phoneNumber: string,
    lang: string,
    longContext?: string // DB profile string (optional)
  ): Promise<{ language: string; name: string; body: string }> {
    let language = lang;
    let name = raw.Name || "Unknown";
    let body = raw.body || "";

    // Store short-term memory (user messages only)
    await MemoryController.saveShortTermMemory(phoneNumber, { language, name, lastBody: body });

    const memoryArray = await MemoryController.loadShortTermMemory(phoneNumber);
    const historyHint = memoryArray?.length
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
- this is the schema of the dtabase ${schema}

OUTPUT FORMAT (two parts, in this exact order):
1) A single line in this exact format:
   language: <lang> Name: <name> body: <your full response text here>

2) based on the user message and the questions asked, try to extract relevant facts and context to populate the FACTS block. use the schema above to guide you on what facts to collect.
    Provide a JSON block like this (with no extra text before or after):
\`\`\`json
{ "FACTS": {
    // Populate only the fields you have new/updated info for
    

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

    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `language: ${language} Name: ${name} body: ${body}` },
      ],
      temperature: 0.2,
    });

    let reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("OpenAI returned no reply");

    // 1) Parse the mandated first line
    const firstLineMatch = reply.match(/^language\s*:\s*(\S+)\s+Name\s*:\s*([\s\S]+?)\s+body\s*:\s*([\s\S]+?)(?:\n|$)/i);
    if (!firstLineMatch) throw new Error("Response is not in correct format (missing first line)");
    const parsed = { language: firstLineMatch[1], name: firstLineMatch[2], body: firstLineMatch[3] };

    // 2) Extract JSON FACTS block (if present)
    let facts: FactsPayload | null = null;
    const jsonBlockMatch = reply.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonBlockMatch) {
      try {
        const parsedJson = JSON.parse(jsonBlockMatch[1]);
        if (parsedJson && parsedJson.FACTS) {
          facts = parsedJson.FACTS as FactsPayload;
        }
      } catch (e) {
        console.warn("Failed to parse FACTS JSON block:", e);
      }
    }

    // 3) Optionally save/update DB with facts
    if (facts) {
      console.log("Extracted facts from AI response:", facts);
      try {
        await MemoryController.saveOrUpdateUserFacts(phoneNumber, facts);
      } catch (e) {
        console.error("Failed to save facts:", e);
      }
    }

    return parsed;
  }
  /**
   * Onboarding stepper:
   * Input: answersSoFar (partial), lastUserMessage
   * Output:
   *   - If not finished: next Hausa question (strict format)
   *   - If finished: { done: true, values: [name, state, location, farmName] }
   */
  public async validateOnboardingAnswer({ questionKey, answer }: {questionKey: string; answer: string }): Promise<[boolean, string]|undefined> {

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

    

    const resp = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: system }, { role: "user", content: system }],
      temperature: 0.2,
    });

    const out = resp.choices?.[0]?.message?.content?.trim() ?? "";
    console.log('Onboarding stepper output:', out);
    // Expecting JSON output
    let obj: { isValid: boolean; message: string } | null = null;
    try {
      obj = JSON.parse(out);
    } catch (e) {
      throw new Error("Onboarding stepper returned invalid JSON");
    }
    if (obj === null || typeof obj.isValid !== "boolean" || typeof obj.message !== "string") {
      // ask it again bbut add u answered this but i need it in valid OUTPUT FORMAT: { "isValid": true|false, "message": "<any correction or note here, or empty if all good>"
      const retrySystem = system + `\n\nYour previous output was: ${out}\n\nPlease respond again in the correct OUTPUT FORMAT: { "isValid": true|false, "message": "<any correction or note here, or empty if all good>" }`;
      const retryResp = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: retrySystem }, { role: "user", content: retrySystem }],
        temperature: 0.2,
      });
      const retryOut = retryResp.choices?.[0]?.message?.content?.trim() ?? "";
      try {
        obj = JSON.parse(retryOut);
      } catch (e) {
        throw new Error("Onboarding stepper returned invalid JSON on retry");
      }
      if (obj === null || typeof obj.isValid !== "boolean" || typeof obj.message !== "string") {
        throw new Error("Onboarding stepper returned invalid structure on retry");
    }
  }
  return [obj.isValid, obj.message] ;
   
}
}