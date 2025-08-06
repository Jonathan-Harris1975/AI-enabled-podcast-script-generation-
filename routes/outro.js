import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load books.json without import assert
const books = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../utils/books.json'), 'utf8')
);

router.post('/', async (req, res) => {
  try {
    const { prompt: userPrompt } = req.body;

    // Pick a random sponsor book
    const sponsorBook = books[Math.floor(Math.random() * books.length)];

    const basePrompt = `
Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly" in a dry British Gen X tone.
New episodes drop every Friday.

Include the following sponsor in the outro:
Title: ${sponsorBook.title}
Author: ${sponsorBook.author}
URL: ${sponsorBook.url}

Sign off with:
"I'm Jonathan Harris, and this is Turing’s Torch: AI Weekly."

If a user prompt is provided, incorporate it naturally.
    `;

    const messages = [
      { role: 'system', content: basePrompt },
      ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.75 // Added temperature setting
    });

    res.json({ outro: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
