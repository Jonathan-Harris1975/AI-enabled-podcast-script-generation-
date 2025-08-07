import express from 'express';
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

    const sponsor = getRandomSponsor(); // e.g. "The Alignment Problem"
    const cta = generateCTA(sponsor);   // returns full SSML string with call to action

    const prompt = `
You're the British Gen X host of an AI podcast called "Turing's Torch: AI Weekly".
Generate a witty, engaging podcast outro using the ebook title: "${sponsor}".
Use SSML with natural pacing and dry humour. End with this CTA:

${cta}

Wrap the output in <speak> tags. Output one JSON-safe line under 4500 chars.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0].message.content.trim();
    res.json({ sessionId, outro });

  } catch (err) {
    console.error('❌ Outro generation failed:', err.message);
    res.status(500).json({ error: 'Outro generation error' });
  }
});

export default router;    fs.writeFileSync(filePath, outroText, 'utf8');

    res.json({
      sessionId,
      outroPath: `storage/${sessionId}/outro.txt`
    });

  } catch (err) {
    console.error('❌ Outro route error:', err);
    res.status(500).json({ error: 'Outro generation failed' });
  }
});

export default router;
