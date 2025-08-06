import express from 'express';
import { openai } from '../services/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { getWeatherSummary } from '../utils/weather.js';

const router = express.Router();

router.post('/intro', async (req, res) => {
  const { sessionId, prompt, date } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let fullPrompt = prompt || '';
    if (date) {
      try {
        const weatherInfo = await getWeatherSummary(date);
        fullPrompt += `\n\nWeather summary for context: ${weatherInfo}`;
      } catch (err) {
        console.warn('Weather fetch failed in /intro:', err.message);
      }
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // lighter for intro
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'Write a single polished intro; no quotes, clean text.' },
        { role: 'user', content: fullPrompt }
      ],
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'intro', content);
    res.json({ sessionId, content });
  } catch (error) {
    console.error('Intro error:', error.message);
    res.status(500).json({ error: 'Intro generation failed', details: error.message });
  }
});

export default router;
