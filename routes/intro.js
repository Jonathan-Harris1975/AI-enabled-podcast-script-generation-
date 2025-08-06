import express from 'express';
import OpenAI from 'openai';
import getWeatherSummary from '../utils/weather.js';
import getDailyQuote from '../utils/quotes.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  try {
    const { date, customPrompt, sessionId } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    const weatherSummary = await getWeatherSummary(date);
    const dailyQuote = await getDailyQuote();

    const prompt = customPrompt || `
      Write a witty and intelligent podcast intro for "Turing's Torch: AI Weekly"
      with a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm.
      Include a cheeky remark about today's London weather: ${weatherSummary}.
      Also weave in this daily quote: "${dailyQuote}".
      Introduce the host, Jonathan Harris, and set the tone for exploring AI news.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: prompt }
      ]
    });

    res.json({ text: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating intro' });
  }
});

export default router;
