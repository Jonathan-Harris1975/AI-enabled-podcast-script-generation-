import express from 'express';
import fs from 'fs';
import path from 'path';

import { openai } from '../utils/openai.js';
import getRandomSponsor from '../utils/getRandomSponsor.js';
import generateCta from '../utils/generateCta.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const book = getRandomSponsor(); // Contains title and slug
    const cta = generateCta(book);

    const prompt = `
You're the dry-witted British host of 'Turing's Torch: AI Weekly'.
Generate a witty, engaging podcast outro that:

- Reflects on the episode's AI theme with humour
- Promotes this week's featured ebook: "${book.title}"
- Includes this call-to-action: ${cta}
- Sounds natural and human (not like you're reading an ad)
- Is written in plain text (no SSML)

Use first-person voice ("I've written", "my book", etc.). Keep it under 800 words.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const outroText = completion.choices[0].message.content.trim();

    // Save to storage
    const storageDir = path.resolve('storage', sessionId);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const outroPath = path.join(storageDir, 'outro.txt');
    fs.writeFileSync(outroPath, outroText);

    res.json({ sessionId, outro: outroText });
  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;
