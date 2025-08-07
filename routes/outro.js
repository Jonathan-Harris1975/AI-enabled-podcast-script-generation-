import express from 'express';
import { openai } from '../utils/openai.js';
import getRandomSponsor from '../utils/getRandomSponsor.js';
import generateCTA from '../utils/generateCTA.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sponsor = getRandomSponsor(); // { title, url }
    const cta = generateCTA(sponsor);   // fallback CTA text

    const prompt = `
You're the British Gen X host of a podcast called "Turing's Torch: AI Weekly".

Generate a plain text outro written in the first person (no 'we', no 'our').

Tone: dry, intelligent, sarcastic, or oddly profound.

Include:
- This week’s ebook title: "${sponsor.title}"
- The book's URL: ${sponsor.url}
- A casual plug for the full ebook collection and newsletter at https://www.jonathan-harris.online
- A punchy final sign-off line

Avoid: robotic phrasing, team references, or formal sign-offs.
Stick to under 1800 characters.
Plain text only. No SSML, tags, or markdown.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();

    // Save to session file
    const filePath = path.join('sessions', `${sessionId}-outro.txt`);
    await fs.writeFile(filePath, outro, 'utf-8');

    res.json({ sessionId, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err.message);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;      model: 'gpt-4',
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
