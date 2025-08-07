// routes/outro.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import getSponsor from '../utils/getSponsor.js';
import generateCta from '../utils/generateCta.js';
import editAndFormat from '../utils/editAndFormat.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sponsor = await getSponsor();
    const cta = await generateCta();

    const prompt = `You're the British Gen X host of Turing's Torch: AI Weekly. You're signing off the show with a witty, reflective outro. Reference this ebook: "${sponsor.title}" (link: ${sponsor.url}). Speak in the first person, no third-person references. Make the book sound like one *you* wrote, and keep the tone dry, confident, and informal. Close with this CTA: ${cta}. Output should be plain text with no paragraph breaks.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const rawOutro = completion.choices[0].message.content.trim();
    const formattedOutro = await editAndFormat(rawOutro);
    const finalOutro = formattedOutro.replace(/\n+/g, ' ');

    const storageDir = path.resolve('/mnt/data', sessionId);
fs.mkdirSync(storageDir, { recursive: true });
fs.writeFileSync(path.join(storageDir, 'intro.txt'), intro); // or outro.txt

    res.json({
      sessionId,
      outroPath: `${storageDir}/outro.txt`
    });
  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
