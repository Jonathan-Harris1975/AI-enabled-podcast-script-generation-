import express from 'express';
import memoryCache from '../utils/memoryCache.js';
import { getWeatherSummary } from '../utils/weather.js';
import { getRandomQuote } from '../utils/quotes.js';
import { callOpenAI } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, date, prompt } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    if (!date) {
      return res.status(400).json({ error: 'date is required for weather' });
    }

    // Get weather + quote
    const weather = await getWeatherSummary(date);
    const quote = getRandomQuote();

    const systemPrompt = prompt
      ? `${prompt}\n\nAlso, ensure it introduces Jonathan Harris as the host of "Turing's Torch: AI Weekly".`
      : `Write a witty and intelligent podcast intro for "Turing’s Torch: AI Weekly" with host Jonathan Harris. 
         Use a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm. 
         Start with a cheeky take on the London weather (moaning encouraged) and weave in this quote: "${quote}". 
         Weather context: ${weather}`;

    const introContent = await callOpenAI(systemPrompt);

    // Cache
    memoryCache.storeSection(sessionId, 'intro', introContent);

    res.json({ sessionId, intro: introContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
