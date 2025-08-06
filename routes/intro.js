import express from 'express';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { introPrompt } from '../utils/promptTemplates.js';
import { getWeatherSummary } from '../utils/weather.js';

const router = express.Router();

router.post('/intro', async (req, res) => {
  const { sessionId, prompt, date } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let promptContent;

    if (prompt) {
      // Use provided custom prompt (weather optional)
      if (date) {
        const weather = await getWeatherSummary(date);
        promptContent = `${prompt}\n\nWeather note: ${weather}`;
      } else {
        promptContent = prompt;
      }
    } else {
      // Default Gen X intro requires date for weather
      if (!date) {
        return res.status(400).json({ error: 'date is required when using default prompt' });
      }
      const weather = await getWeatherSummary(date);
      promptContent = `${introPrompt}\n\nToday's weather: ${weather}`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a sarcastic Gen X podcast intro writer.' },
        { role: 'user', content: promptContent }
      ]
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
