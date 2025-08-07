// routes/intro.js
import express from 'express';
import { openai } from '../utils/openai.js';
import getWeatherSummary from '../utils/weather.js';
import getRandomQuote from '../utils/quotes.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { date } = req.body;

    const weather = await getWeatherSummary(date);
    const quote = getRandomQuote();

    const systemPrompt = `
You're Jonathan Harris, host of the podcast "Turing's Torch: AI Weekly".
Welcome listeners in a conversational, thoughtful tone.
Mention the current weather: ${weather}.
Share this AI-related quote from Alan Turing: "${quote}".
Introduce the podcast and today's theme or highlight.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    });

    const message = completion.choices?.[0]?.message?.content?.trim();

    if (!message) throw new Error('No response from OpenAI');

    res.status(200).json({ message });
  } catch (error) {
    console.error('Intro generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
