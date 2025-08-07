// ✅ /routes/intro.js — FINAL

import express from 'express'; import { openai } from '../utils/openai.js'; import getWeatherSummary from '../utils/weather.js'; import getTuringQuote from '../utils/quote.js'; import getEpisodeNumber from '../utils/episodeNumber.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const weather = await getWeatherSummary(); const quote = await getTuringQuote(); const episode = await getEpisodeNumber();

const prompt = `

Write a witty British Gen X podcast intro for 'Turing's Torch: AI Weekly'. Start with a snarky weather-related line, then introduce the host Jonathan Harris by name. Follow with a natural segue into this week's AI news and include the episode number: ${episode}. End with this quote from Alan Turing: "${quote}" — keep it dry, clever, and succinct. No SSML, no title, just the raw intro text. Today’s weather: ${weather}`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.7,
  messages: [{ role: 'user', content: prompt }]
});

const intro = completion.choices[0]?.message?.content?.trim();
if (!intro) throw new Error('No intro generated');

res.status(200).json({ episode, intro });

} catch (err) { console.error('❌ Intro error:', err.message); res.status(500).json({ error

                                                                                    
