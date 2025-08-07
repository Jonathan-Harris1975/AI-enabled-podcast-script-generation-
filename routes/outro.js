// routes/outro.js
import express from 'express';
import { openai } from '../utils/openai.js';
import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, ebookTitle, ebookUrl } = req.body;
    if (!sessionId || !ebookTitle || !ebookUrl) {
      throw new Error('Missing required fields');
    }

    const prompt = `
You're the sarcastic British Gen X host of the AI podcast "Turing's Torch", Jonathan Harris.

Generate a closing outro for an AI podcast episode. Plug the featured ebook of the week naturally.

Ebook Title: ${ebookTitle}
Ebook Link: ${ebookUrl}

Style: dry wit, confident delivery, and no SSML. Must include:
- A friendly goodbye
- A reminder to follow/subscribe
- Mention the ebook title + link
- Do NOT reference episode numbers
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const outro = completion.choices[0]?.message?.content?.trim();
    if (!outro) throw new Error('Outro generation failed');

    saveToMemory(sessionId, 'outro', outro);
    res.status(200).json({ outro });

  } catch (err) {
    console.error('❌ Outro route error:', err.message);
    res.status(500).json({ error: 'Outro generation failed.' });
  }
});

export default router;
