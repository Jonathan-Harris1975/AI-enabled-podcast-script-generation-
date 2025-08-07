// ✅ /routes/intro.js — Generates the intro with baked-in host name + episode number

import express from 'express'; import fs from 'fs/promises'; import path from 'path'; import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) throw new Error('No sessionId provided');

const storageDir = path.join('storage', sessionId);

const episodeNumber = parseInt(await fs.readFile(path.join(storageDir, 'episode.txt'), 'utf8'));
const weather = await fs.readFile(path.join(storageDir, 'weather.txt'), 'utf8');
const quote = await fs.readFile(path.join(storageDir, 'quote.txt'), 'utf8');

const prompt = `

You're the sarcastic British Gen X host of the AI podcast 'Turing’s Torch: AI Weekly'.

Write a dry, clever intro that includes:

A witty British weather metaphor (from: ${weather})

An Alan Turing quote (from: ${quote})

A natural line: "I'm your host, Jonathan Harris."

A mention that this is "Episode ${episodeNumber}"


Tone: intelligent, funny, relaxed — like a Gen X radio presenter. Plain text only. Max 90 seconds spoken. `;

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.75,
  messages: [{ role: 'user', content: prompt }]
});

const intro = completion.choices[0]?.message?.content?.trim();
if (!intro) throw new Error('No

                            
