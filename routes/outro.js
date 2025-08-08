// routes/outro.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import getSponsor from '../utils/getSponsor.js';
import generateCta from '../utils/generateCta.js';
import { getOutroPrompt, selectedTone } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sponsor = await getSponsor();
    const cta = await generateCta();

    // Use our centralized outro prompt with consistent tone & host name
    const prompt = getOutroPrompt({
      sponsorTitle: sponsor.title,
      sponsorURL: sponsor.url,
      cta
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    let finalOutro = completion.choices[0].message.content.trim();

    // Ensure plain text with no paragraph breaks
    finalOutro = finalOutro.replace(/\n+/g, ' ');

    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });
    const outroPath = path.join(storageDir, 'outro.txt');
    fs.writeFileSync(outroPath, finalOutro);

    res.json({
      sessionId,
      tone: selectedTone,
      outroPath
    });

  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    res.status(500).json({ error: 'Failed to generate outro', details: err.message });
  }
});

export default router;
