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

    // Pick a random book and get its CTA line
    const sponsor = getRandomSponsor(); // e.g. { title: "20", url: "https://..." }
    const cta = generateCTA(sponsor);   // e.g. "You can find it at https://..."

    const prompt = `
You're the British Gen X host of an AI podcast called "Turing's Torch: AI Weekly".
Write a short, dry-witted outro that wraps up the episode and promotes this ebook:

Title: "${sponsor.title}"
URL: ${sponsor.url}

Include the call to action below as the final paragraph:
"${cta}"

Use dry humour, plain UK English, and no SSML or voice instructions.
The output should be plain text and under 1000 words.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();

    // Ensure sessions folder exists
    const sessionsDir = path.resolve('sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir);
    }

    // Save the outro to a file
    const outputPath = path.join(sessionsDir, `${sessionId}-outro.txt`);
    fs.writeFileSync(outputPath, outro, 'utf-8');

    // Return JSON response
    res.json({ sessionId, sponsor, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err.message);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;
