import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { outroPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

// Load books.json manually via fs
const booksPath = path.join(process.cwd(), 'utils', 'books.json');
const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

function getRandomBook() {
  return books[Math.floor(Math.random() * books.length)];
}

router.post('/outro', async (req, res) => {
  const { sessionId, prompt } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let promptContent;
    if (prompt) {
      promptContent = prompt;
    } else {
      const book = getRandomBook();
      promptContent = outroPrompt
        .replace('{{book.title}}', book.title)
        .replace('{{book.url}}', book.url);
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'Write a polished, concise podcast outro in British English.' },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'outro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Outro error:', error.message);
    res.status(500).json({ error: 'Outro generation failed', details: error.message });
  }
});

export default router;
