import express from 'express';
import fs from 'fs';
import path from 'path';
import fetchFeeds from '../utils/fetchFeeds.js';
import getMainPrompt from '../prompts/getMainPrompt.js';
import chunkText from '../utils/chunkText.js';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Directory for persistent storage
const persistentDir = path.join(process.cwd(), 'sessions');
if (!fs.existsSync(persistentDir)) {
  fs.mkdirSync(persistentDir);
}

router.post('/', async (req, res) => {
  try {
    const { feedUrl, sessionId } = req.body;
    if (!feedUrl || !sessionId) {
      return res.status(400).json({ error: 'feedUrl and sessionId are required' });
    }

    const sessionDir = path.join(persistentDir, sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Fetch up to 40 feed items with improved date handling
    const items = await fetchFeeds(feedUrl, { limit: 40 });

    const savedFiles = [];

    for (const [index, item] of items.entries()) {
      // Grab content snippet or fallback
      const articleText = item.contentSnippet || item.content || item.summary || '';
      const prompt = getMainPrompt(articleText);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const output = completion.choices[0]?.message?.content || '';
      const chunks = chunkText(output);

      chunks.forEach((chunk, chunkIndex) => {
        const filename = `main-${index + 1}-${chunkIndex + 1}.txt`;
        const filePath = path.join(sessionDir, filename);
        fs.writeFileSync(filePath, chunk);
        savedFiles.push(filename);
      });
    }

    res.json({ files: savedFiles });
  } catch (error) {
    console.error('Error generating main scripts:', error);
    res.status(500).json({ error: 'Failed to generate main scripts' });
  }
});

export default router;
