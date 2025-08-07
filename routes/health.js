import express from 'express';
import { openai } from '../utils/openai.js';
import getWeatherSummary from '../utils/weather.js';
import getRandomQuote from '../utils/quotes.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { location, date, prompt } = req.body;

    const weather = await getWeatherSummary(location, date);
    const quote = getRandomQuote();

    const systemPrompt = `
You are the voice of Jonathan Harris, host of the podcast "Turing's Torch: AI Weekly".
Speak in a Gen X tone, thoughtful but wry.
Start the podcast with:
1. The quote of the week (with attribution).
2. A short weather update for ${location}.
3. A welcome message to listeners for this episode.

Make sure to say your name and podcast title clearly.`;

    const fullPrompt = `${systemPrompt}\n\nQuote: "${quote}"\nWeather: ${weather}\n${prompt || ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const message = completion.choices[0].message.content.trim();
    res.status(200).json({ message });
  } catch (error) {
    console.error('Intro generation error:', error);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
