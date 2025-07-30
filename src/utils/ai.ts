import { request } from 'undici';

export async function getAIResponse(userMessage: string): Promise<string> {
  const { body } = await request('https://openrouter.ai/api/v1/chat/completions', {
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

  const data = await body.json() as any;
  console.log('AI Response:', data);
  return data.choices?.[0]?.message?.content?.trim() ?? 'Unavailable.';
}
