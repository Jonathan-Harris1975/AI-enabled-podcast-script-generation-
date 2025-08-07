import { openai } from './openai.js';

export default async function editAndFormat(scriptText) {
  const prompt = `
You are a skilled podcast editor. Polish this AI-generated script for natural British  Gen X delivery:
- Maintain sarcastic, witty tone
- Fix repetition or awkward phrasing
- Improve flow and transitions
- Output plain clean text only — no markup

Script:
${scriptText}
  `.trim();

  const result = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.7,
    messages: [
      { role: 'user', content: prompt }
    ]
  });

  return result.choices[0].message.content.trim();
}
