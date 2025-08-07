// ✅ INTRO ROUTE (FULLY UPDATED)

import express from 'express'; import getWeatherSummary from '../utils/weather.js'; import getTuringQuote from '../utils/getTuringQuote.js';

const router = express.Router();

router.get('/', async (req, res) => { try { console.log('🌤️ Generating intro...');

const weather = await getWeatherSummary();
const quote = getTuringQuote();

const intro = `

Hello, dear listeners, and welcome to another episode of "Turing's Torch: AI Weekly." I'm your host, Jonathan Harris — broadcasting direct from London, where the weather today is ${weather.toLowerCase()} — which, let’s be honest, is just Britain's way of saying, “try again tomorrow.”

Before we dive headfirst into this week’s digital chaos, here’s a bit of wisdom from Alan Turing: "${quote}"

So grab a strong cuppa, slap your neural nets into gear, and let’s get sarcastic about silicon. `;

res.status(200).json({ intro });

} catch (err) { console.error('❌ Intro route error:', err.message); res.status(500).json({ error: 'Failed to generate intro.' }); } });

export default router;

