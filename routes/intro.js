import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../services/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { getWeatherSummary } from '../utils/weather.js';
import { introPrompt } from '../utils/promptTemplates.js';

const router = express.Router();
const quotesPath = path.join(process.cwd(), 'utils', 'quotes.txt');

function getRandomQuote() {
  const quotes = fs.readFileSync(quotesPath, 'utf-8')
    .split('\n')
    .map(q => q.trim())
    .filter(Boolean);
  return quotes.length > 0
    ? quotes[Math.floor(Math.random() * quotes.length)]
    : '';
}

router.post('/intro', async (req, res) => {
  const { sessionId, date } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let promptContent = introPrompt;

    if (date) {
      try {
        const weatherInfo = await getWeatherSummary(date);
        promptContent += `\n\nWeather summary: ${weatherInfo}`;
      } catch (err) {
        console.warn('Weather fetch failed in /intro:', err.message);
      }
    }

    const quote = getRandomQuote();
    if (quote) {
      promptContent += `\n\nQuote of the day: "${quote}" — Alan Turing`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a witty British podcast host.' },
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

export default router;        promptContent += `\n\nWeather summary: ${weatherInfo}`;
      } catch (err) {
        console.warn('Weather fetch failed in /intro:', err.message);
      }
    }

    // Add random quote
    const quote = getRandomQuote();
    if (quote) {
      promptContent += `\n\nQuote of the day: "${quote}" — Alan Turing`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a witty British podcast host.' },
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
