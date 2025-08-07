import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) throw new Error('No sessionId provided');

    const prompt = `
You're the sarcastic British Gen X host of 'Turing's Torch'.

Write four short outro segments for a podcast as **individual plain-text fields** in JSON format:

{
  "sponsorBlurb": "",
  "reminder": "",
  "finalMessage": "",
  "signOff": ""
}

Keep tone humorous and blunt. No SSML, no HTML. No AI mentions.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('No response from OpenAI.');

    const match = raw.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error('No JSON block found.');
    const outro = JSON.parse(match[0]);

    const dir = path.join('storage', sessionId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'outro.json'), JSON.stringify(outro, null, 2), 'utf8');

    res.status(200).json(outro);

  } catch (err) {
    console.error('❌ Outro route error:', err.message);
    res.status(500).json({ error: 'Failed to generate outro.', details: err.message });
  }
});

export default router;
