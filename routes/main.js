// routes/main3.js — PODCAST MAIN GENERATOR ONLY

import express from 'express'; import fetchFeeds from '../utils/fetchFeeds.js'; import getWeatherSummary from '../utils/weather.js'; import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => { try { console.log('🧠 Generating podcast main content...');

const articles = await fetchFeeds();
const weather = await getWeatherSummary();

const articleText = articles.map((a, i) => `${i + 1}. ${a.title} - ${a.summary}`).join('\n');

const systemPrompt = `

You're the host of a weekly podcast called 'Turing's Torch'. Tone: British Gen X, witty, sarcastic, intelligent. Today's weather: ${weather} Here are this week's top stories: ${articleText}

Weave these into a single, cohesive main script. Prioritise storytelling and cultural commentary. Avoid listing headlines. Make it sound like a polished monologue. Include natural transitions, pacing, and a confident voice.`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.76,
  messages: [
    { role: 'system', content: systemPrompt }
  ]
});

const transcript = completion.choices[0].message.content.trim();
res.status(200).json({ transcript });

} catch (err) { console.error('❌ Main route error:', err.message); res.status(500).json({ error: 'Podcast generation failed' }); } });

export default router;

