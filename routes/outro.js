import express from 'express';
import OpenAI from '../utils/openai.js';
import books from '../utils/books.json' assert { type: 'json' };

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { prompt: externalPrompt } = req.body;

    const randomBook = books[Math.floor(Math.random() * books.length)];

    let systemPrompt = `
      Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly"  
      in a dry British Gen X tone. Sign off as Jonathan Harris.  
      Mention this book as the episode's sponsor: "${randomBook.title}" by ${randomBook.author}.  
      New episodes drop every Friday.  
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

    res.json({ outro: response.choices[0].message.content });
  } catch (error) {
    console.error('Error generating outro:', error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
