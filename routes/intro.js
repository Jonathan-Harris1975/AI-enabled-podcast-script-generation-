import express from 'express';
import OpenAI from 'openai';
import quotes from '../utils/quotes.js';
import getWeatherSummary from '../utils/weather.js';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
  try {
    const { date, externalPrompt } = req.body;

    // Weather data for intro
    const weatherSummary = await getWeatherSummary(date);

    // Pick a random quote from quotes.txt
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Build the system prompt
    const systemPrompt = `
      Write a witty and intelligent podcast intro for "Turing’s Torch: AI Weekly"
      with a British Gen X tone — dry humour, cultural nods, and a touch of sarcasm.
      Start with a cheeky take on the London weather (moaning encouraged) based on:
      "${weatherSummary}".

      Include this quote somewhere in the intro: "${randomQuote}"

      Introduce the host, Jonathan Harris, by name and clearly state the show title.
      Keep it confident, irreverent, and intellectually sharp.

      ${externalPrompt ? `Additional instruction: ${externalPrompt}` : ''}
    `;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    });

    const introText = completion.choices[0].message.content.trim();
    res.json({ intro: introText });

  } catch (error) {
    console.error('Error generating intro:', error);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
