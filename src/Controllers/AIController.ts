// src/Controllers/AIController.ts

import OpenAI from "openai";
import { MemoryController} from "./memoryController";
import {MainBody} from "./mainController";  

export class AIController {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  public async handleMessage(
    raw: MainBody,
    phoneNumber: string,
    lang: string
  ): Promise<{ language: string; name: string; body: string }> {
    let language: string;
    let name: string;
    let body: string;

  

   
      language = lang;
      name = raw.Name || "Unknown";
      body = raw.body || "";

      await MemoryController.saveShortTermMemory(phoneNumber, {
        language,
        name,
        lastBody: body,
      });
    

    // Re-fetch memory history after saving new entry
    const memoryArray = await MemoryController.loadShortTermMemory(phoneNumber);
    const historyHint = memoryArray?.length
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
    const response = await this.client.chat.completions.create({
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


let counter = 0;
    const reply = response.choices?.[0]?.message?.content?.trim();
    console.log("AI response:", reply); 
    if (!reply) {
      throw new Error("OpenAI returned no reply");
    }

    let parsed = reply.match(
      /^language\s*:\s*(\S+)\s+Name\s*:\s*([\s\S]+?)\s+body\s*:\s*([\s\S]+)$/i
    );
    while (!parsed && counter < 3) {
        console.log("Retrying AI response parsing...");
        counter++;
        const retryResponse = await this.client.chat.completions.create({
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
        const retryReply = retryResponse.choices?.[0]?.message?.content?.trim();
        console.log("Retry AI response:", retryReply);
        if (!retryReply) {
            throw new Error("OpenAI returned no reply on retry");
        }
        parsed = retryReply.match(
            /^language\s*:\s*(\S+)\s+Name\s*:\s*([\s\S]+?)\s+body\s*:\s*([\s\S]+)$/i
        );
    }
    if (!parsed) {
      throw new Error("Response is not in correct format");
    }

    return {
      language: parsed[1],
      name: parsed[2],
      body: parsed[3],
    };
  }
}
