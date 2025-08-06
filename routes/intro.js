import express from 'express';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { introPrompt } from '../utils/promptTemplates.js';
import { getWeatherSummary } from '../utils/weather.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load quotes once
const quotesPath = path.resolve('./utils/quotes.txt');
const quotes = fs.readFileSync(quotesPath, 'utf-8').split('\n').filter(Boolean);

function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

router.post('/intro', async (req, res) => {
  const { sessionId, prompt, date } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    // Get weather & quote
    const weather = await getWeatherSummary(date);
    const quote = getRandomQuote();

    let promptContent;
    if (prompt) {
      // Append weather & quote to custom prompt
      promptContent = `${prompt}\n\nWeather update: ${weather}\nQuote of the day: "${quote}"`;
    } else {
      // Default Gen X intro prompt + weather + quote
      promptContent = `${introPrompt}\n\nWeather update: ${weather}\nQuote of the day: "${quote}"`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content: "Write a witty and intelligent podcast intro for 'Turing’s Torch: AI Weekly' with a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm. Start with a cheeky take on the London weather (moaning encouraged), naturally. Introduce the host Jonathan Harris and set the tone for exploring AI news. Keep the vibe confident, irreverent, and intellectually sharp—something that hooks Gen X listeners without sounding robotic."
        },
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

export default router;    if (prompt) {
      // Append weather & quote to custom prompt
      promptContent = `${prompt}\n\nWeather update: ${weather}\nQuote of the day: "${quote}"`;
    } else {
      // Default Gen X intro prompt + weather + quote
      promptContent = `${introPrompt}\n\nWeather update: ${weather}\nQuote of the day: "${quote}"`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content: "Write a witty and intelligent podcast intro for 'Turing’s Torch: AI Weekly' with a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm. Start with a cheeky take on the London weather (moaning encouraged), naturally. Introduce the host Jonathan Harris and set the tone for exploring AI news. Keep the vibe confident, irreverent, and intellectually sharp—something that hooks Gen X listeners without sounding robotic."
        },
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
