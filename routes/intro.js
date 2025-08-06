import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import getWeatherSummary from '../utils/weather.js';
import getQuote from '../utils/quotes.js';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional: load extra resources here if needed

router.post('/', async (req, res) => {
  try {
    const { prompt: userPrompt, date } = req.body;

    // Fetch weather + quote
    const weatherSummary = await getWeatherSummary(date);
    const quote = await getQuote();

    const basePrompt = `
Write a witty and intelligent podcast intro for "Turing’s Torch: AI Weekly" hosted by Jonathan Harris
in a British Gen X tone — dry humour, cultural nods, and a touch of sarcasm.
Start with a cheeky take on the London weather: ${weatherSummary}.
Include the quote of the day: "${quote}".
Set the tone for exploring AI news with confidence, irreverence, and intellectual sharpness.
    `;

    const messages = [
      { role: 'system', content: basePrompt },
      ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.75
    });

    res.json({ intro: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
