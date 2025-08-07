// routes/intro.js
import express from 'express';
import { openai } from '../utils/openai.js';
import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { weather, turingQuote, sessionId } = req.body;
    if (!sessionId || !weather || !turingQuote) throw new Error('Missing required fields');

    const prompt = `
You're the host of the British podcast "Turing’s Torch: AI Weekly", voiced with a sarcastic British Gen X tone. Your name is Jonathan Harris. Begin the episode with a weather-related opener, then deliver this Alan Turing quote with gravitas.

Weather: ${weather}
Quote: ${turingQuote}

Add personality and flair, bake in your name as host, and make it engaging without saying the episode number. Return plain text, no SSML.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const intro = completion.choices[0]?.message?.content?.trim();
    if (!intro) throw new Error('Intro generation failed');

    saveToMemory(sessionId, 'intro', intro);
    res.status(200).json({ intro });

  } catch (err) {
    console.error('❌ Intro error:', err.message);
    res.status(500).json({ error: 'Intro generation failed.' });
  }
});

export default router;
