import express from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Read books.json manually (avoids assert { type: 'json' })
const booksPath = path.join(process.cwd(), 'utils', 'books.json');
let books = [];
try {
  const data = fs.readFileSync(booksPath, 'utf8');
  books = JSON.parse(data);
} catch (err) {
  console.error('Error reading books.json:', err);
}

// POST /outro
router.post('/', async (req, res) => {
  const { prompt: externalPrompt, sessionId: clientSessionId } = req.body;
  const sessionId = clientSessionId || uuidv4();

  try {
    // Pick a random book
    const sponsorBook = books.length > 0 ? books[Math.floor(Math.random() * books.length)] : null;

    // Default Gen X outro prompt
    let systemPrompt = `Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly" in a dry British Gen X tone.
New episodes drop every Friday.
Include a nod to the show's host, Jonathan Harris, and close with a clever sign-off.
Also mention this week's sponsor book: ${sponsorBook ? sponsorBook.title + ' by ' + sponsorBook.author : 'No sponsor book available'}.
Make it smart, sarcastic, and memorable.`;

    // Override with external prompt if provided
    if (externalPrompt && externalPrompt.trim().length > 0) {
      systemPrompt = externalPrompt;
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      max_tokens: 400
    });

    res.json({
      sessionId,
      outro: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error generating outro:', error);
    res.status(500).json({ error: 'Failed to generate outro', details: error.message });
  }
});

export default router;
