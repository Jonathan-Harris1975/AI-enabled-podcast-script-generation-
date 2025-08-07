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

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sponsor = getRandomSponsor(); // full { title, shortUrl }
    const cta = generateCTA(sponsor);   // plain text CTA

    const prompt = `
You're the British Gen X host of a witty podcast called "Turing's Torch: AI Weekly".
Craft a 1-paragraph casual outro with dry humour, mentioning the ebook title "${sponsor.title}".
Include the following call to action at the end:

${cta}

Use plain text only. No SSML. No markdown. No quotes or formatting.
Tone: witty, sharp, slightly sarcastic. No cheesy sales talk. No over-explaining.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();

    // Save outro to /storage/sessionId/outro.txt
    const storageDir = path.resolve('storage', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(path.join(storageDir, 'outro.txt'), outro, 'utf-8');

    res.json({ sessionId, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err.message);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;
