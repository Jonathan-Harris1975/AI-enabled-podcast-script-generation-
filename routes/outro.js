import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import getRandomSponsor from '../utils/getRandomSponsor.js';
import generateCTA from '../utils/generateCTA.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const sponsor = getRandomSponsor(); // contains title + shortUrl
    const cta = generateCTA(sponsor);

    const prompt = `
You're the British Gen X host of an AI podcast called "Turing's Torch: AI Weekly".
Generate a witty, engaging podcast outro using the ebook title: "${sponsor.title}".
End with this CTA:
${cta}
Output plain text only, no SSML.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();

    const outputPath = path.resolve('sessions', `${sessionId}-outro.txt`);
    fs.writeFileSync(outputPath, outro, 'utf-8');

    res.json({ sessionId, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err.message);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;
