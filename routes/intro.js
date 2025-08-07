import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    if (!sessionId) throw new Error('No sessionId provided');

    const fullPrompt = `
You're the sarcastic British Gen X host of 'Turing's Torch'.

Generate a casual and witty podcast intro (plain text only). Keep it short and human. Include a brief nod to the weekly AI weather theme. No sponsor, no outro. Just set the tone.

${prompt || ''}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const intro = completion.choices[0]?.message?.content?.trim();
    if (!intro) throw new Error('Empty intro from OpenAI.');

    const dir = path.join('storage', sessionId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'intro.txt'), intro, 'utf8');

    res.status(200).json({ intro });

  } catch (err) {
    console.error('❌ Intro route error:', err.message);
    res.status(500).json({ error: 'Failed to generate intro.', details: err.message });
  }
});

export default router;
