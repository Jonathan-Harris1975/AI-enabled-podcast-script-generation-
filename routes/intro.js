import express from 'express';
import OpenAI from '../utils/openai.js';
import getWeatherSummary from '../utils/weather.js';
import quotes from '../utils/quotes.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { date, externalPrompt } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required for the weather API.' });
    }

    // Fetch weather
    const weatherSummary = await getWeatherSummary(date);

    // Pick a random Alan Turing quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    // Build system prompt
    let systemPrompt = `
      Write a witty and intelligent podcast intro for "Turing’s Torch: AI Weekly" 
      with a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm.  
      Start with a cheeky take on the London weather: "${weatherSummary}".  
      Then include this Alan Turing quote: "${randomQuote}".  
      Introduce the host Jonathan Harris and set the tone for exploring AI news.  
      Keep it confident, irreverent, and intellectually sharp—hooking Gen X listeners without sounding robotic.
    `;

    // If external prompt provided, append it
    if (externalPrompt) {
      systemPrompt += `\nExtra instructions: ${externalPrompt}`;
    }

    const completion = await OpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    });

    res.json({ intro: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating intro:', error);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

export default router;
