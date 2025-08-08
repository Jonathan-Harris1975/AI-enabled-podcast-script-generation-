// routes/outro.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import getSponsor from '../utils/getSponsor.js';
import generateCta from '../utils/generateCta.js';

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

    const rawOutro = completion.choices[0]?.message?.content?.trim();

    if (!rawOutro) {
      console.error('❌ No outro generated from OpenAI');
      return res.status(500).json({ error: 'OpenAI did not return any content' });
    }

    // Replace line breaks
    const formattedOutro = rawOutro.replace(/\n+/g, ' ');

    // Write to disk
    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(path.join(storageDir, 'outro.txt'), formattedOutro);

    // Respond
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
