import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import getWeatherSummary from '../utils/weather.js';
import getQuote from '../utils/quotes.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /intro
router.post('/', async (req, res) => {
  const { date, prompt: externalPrompt, sessionId: clientSessionId } = req.body;
  const sessionId = clientSessionId || uuidv4();

  try {
    // Fetch weather + quote
    const weatherSummary = await getWeatherSummary(date || new Date().toISOString().split('T')[0]);
    const quote = await getQuote();

    // Default Gen X intro prompt
    let systemPrompt = `Write a witty and intelligent podcast intro for "Turing’s Torch: AI Weekly" with a British Gen X tone — dry humour, cultural nods, and a touch of sarcasm. 
Start with a cheeky take on the London weather (moaning encouraged) using this weather data: ${weatherSummary}.
Include this inspirational quote: "${quote}".
Introduce the host Jonathan Harris by name and set the tone for exploring AI news with confidence, irreverence, and intellect — hooking Gen X listeners without sounding robotic.`;

    // Override with external prompt if provided
    if (externalPrompt && externalPrompt.trim().length > 0) {
      systemPrompt = externalPrompt;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      max_tokens: 400
    });

    res.json({
      sessionId,
      intro: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error generating intro:', error);
    res.status(500).json({ error: 'Failed to generate intro', details: error.message });
  }
});

export default router;
