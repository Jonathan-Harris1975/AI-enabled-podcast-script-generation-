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

    // Get sponsor + CTA
    const sponsor = getRandomSponsor(); // e.g. { title, url }
    const cta = generateCTA(sponsor);   // plain text CTA

    const prompt = `
You're a dry-witted British Gen X podcast host wrapping up an episode of "Turing's Torch: AI Weekly".
Your audience is smart, curious, and likely mildly caffeinated.
You're signing off solo — no team, no "we".
The sponsor is titled "${sponsor.title}" and is available at: ${sponsor.url}

Write a short, original outro that:
- Feels conversational and human
- Embeds the sponsor title and URL naturally
- Ends with the CTA: "${cta}"
- NO bullet points, NO SSML, NO markdown — just raw text
- Keep it punchy and under 600 words
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();

    // Save to session folder
    const storagePath = path.resolve('storage', sessionId);
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }

    fs.writeFileSync(path.join(storagePath, 'outro.txt'), outro);

    res.json({ sessionId, sponsor, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;
