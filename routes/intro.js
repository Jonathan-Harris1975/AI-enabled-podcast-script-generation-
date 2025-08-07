// routes/intro.js import express from 'express'; import { openai } from '../utils/openai.js'; import getWeatherSummary from '../utils/weather.js'; import fetchQuotes from '../utils/fetchQuotes.js'; import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId, date, episode, reset } = req.body; if (!sessionId || !date || !episode) { return res.status(400).json({ error: 'Missing required fields' }); }

const weather = await getWeatherSummary();
const quote = await fetchQuotes();

const systemPrompt = `You're Jonathan Harris, host of Turing’s Torch: AI Weekly. Use a dry, British Gen X tone. Open with a sharp weather jab, blend in the week's tone, and wrap with an Alan Turing quote.`;
const userPrompt = `Today’s weather summary: ${weather}

Alan Turing quote: ${quote} Date: ${date} Episode: ${episode}

Give us a strong podcast intro.`;

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.7,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
});

const intro = response.choices[0].message.content.trim();
await saveToMemory(sessionId, 'intro', intro, reset);
res.json({ intro });

} catch (err) { console.error('❌ Intro error:', err.message); res.status(500).json({ error: 'Failed to generate intro' }); } });

export default router;

