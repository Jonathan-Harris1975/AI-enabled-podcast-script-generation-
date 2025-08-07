import express from 'express';
import fs from 'fs';
import path from 'path';

import { openai } from '../utils/openai.js';
import getRandomSponsor from '../utils/getRandomSponsor.js';
import generateCta from '../utils/generateCta.js';
import generateOutroPrompt from '../utils/generateOutro.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const book = getRandomSponsor();         // ✅ Includes slug + title
    const cta = generateCta(book);           // ✅ Clean fallback CTA included
    const prompt = generateOutroPrompt(book, cta); // ✅ Dynamic prompt

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();

    const dir = path.resolve('storage', sessionId);
    const file = path.join(dir, 'outro.txt');

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, outro, 'utf-8');

    console.log(`✅ Outro saved to: ${file}`);
    res.json({ sessionId, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err.message);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;
