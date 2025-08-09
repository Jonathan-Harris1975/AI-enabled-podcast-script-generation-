import OpenAI from 'openai';

const openai = new OpenAI(); // expects OPENAI_API_KEY in env

export default async function editAndFormat(scriptText) {
  if (typeof scriptText !== 'string' || !scriptText.trim()) {
    throw new Error('Invalid or empty scriptText');
  }

  const instructions = `
You are a skilled podcast editor. Polish this AI-generated script for natural British Gen X delivery:
- Maintain sarcastic, witty tone
- Fix repetition or awkward phrasing
- Improve flow and transitions
- Output plain clean text only — no markup, no markdown, no HTML tags, no formatting of any kind
- Avoid extra line breaks; only natural paragraph breaks allowed
`.trim();

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: scriptText }
      ]
    });

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ editAndFormat failed:', error);
    throw error;
  }
}
