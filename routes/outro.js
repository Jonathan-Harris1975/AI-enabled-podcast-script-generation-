import express from 'express';
import OpenAI from 'openai';
import books from '../utils/books.json' assert { type: 'json' };

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  try {
    const { customPrompt, sessionId } = req.body;

    const randomBook = books[Math.floor(Math.random() * books.length)];

    const prompt = customPrompt || `
      Write a confident, witty podcast outro for "Turing's Torch: AI Weekly"
      in a dry British Gen X tone. Include the sponsor book: "${randomBook.title}" by ${randomBook.author}.
      Sign off as Jonathan Harris, reminding listeners new episodes drop every Friday.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: prompt }
      ]
    });

    res.json({ text: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating outro' });
  }
});

export default router;
