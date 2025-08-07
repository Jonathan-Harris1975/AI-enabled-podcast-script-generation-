import express from 'express';
import { openai } from '../utils/openai.js';
import getRandomSponsor from '../utils/getRandomSponsor.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sponsor = getRandomSponsor(); // { title, url }

    const prompt = `
You're the British Gen X host of an AI podcast called "Turing's Torch: AI Weekly".
Generate a witty, engaging outro that wraps up the episode naturally.

End with a persuasive call to action to promote this ebook:
Title: "${sponsor.title}"
Link: ${sponsor.url}

Speak in a conversational tone with dry humour. Wrap the output in <speak> tags.
Ensure the final output is one escaped, JSON-safe line under 4500 characters.
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

export default router;
