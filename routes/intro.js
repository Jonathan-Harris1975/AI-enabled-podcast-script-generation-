import express from 'express';
import OpenAI from '../utils/openai.js';
import getWeatherSummary from '../utils/weather.js';
import quotes from '../utils/quotes.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { date, prompt: externalPrompt } = req.body;

    const weatherSummary = await getWeatherSummary(date);
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    let systemPrompt = `
      Write a witty and intelligent podcast intro for "Turing’s Torch: AI Weekly" 
      with a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm.
      Start with a cheeky take on the London weather (moaning encouraged), then 
      introduce the host, Jonathan Harris, and set the tone for exploring AI news.  
      Include this weather summary: "${weatherSummary}".  
      Also include this Alan Turing quote somewhere in the intro: "${randomQuote}".  
      Keep the vibe confident, irreverent, and intellectually sharp.
    `;

    if (externalPrompt) {
      systemPrompt += `\n\nAdditional context from user: ${externalPrompt}`;
    }

    const response = await OpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt }
      ],
    });

    res.json({ intro: response.choices[0].message.content });
  } catch (error) {
    console.error('Error generating intro:', error);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
