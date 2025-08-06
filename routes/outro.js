import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load books.json without assert
const books = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../utils/books.json'), 'utf8')
);

router.post('/', async (req, res) => {
  try {
    const { prompt: userPrompt } = req.body;
    const sponsorBook = books[Math.floor(Math.random() * books.length)];

    const basePrompt = `
Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly" in a dry British Gen X tone.
Include the following sponsor:
Title: ${sponsorBook.title}
Author: ${sponsorBook.author}
URL: ${sponsorBook.url}
Sign off with: "I'm Jonathan Harris, and this is Turing’s Torch: AI Weekly."
If a user prompt is provided, weave it in naturally.
    `;

    const messages = [
      { role: 'system', content: basePrompt },
      ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.75
    });

    res.json({ outro: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
