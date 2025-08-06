import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from '../utils/openai.js';

const router = express.Router();

// Load books.json the old-school way
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const booksPath = path.join(__dirname, '../utils/books.json');
const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

router.post('/', async (req, res) => {
  try {
    const { externalPrompt } = req.body;

    // Pick a random sponsor book
    const randomBook = books[Math.floor(Math.random() * books.length)];

    let systemPrompt = `
      Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly"
      in a dry British Gen X tone.  
      New episodes drop every Friday.  
      Include a sign-off from Jonathan Harris and mention the sponsor book: "${randomBook.title}" by ${randomBook.author}.  
      Make it clever, self-aware, and sharp — like the machines are listening.
    `;

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

    res.json({ outro: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating outro:', error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
