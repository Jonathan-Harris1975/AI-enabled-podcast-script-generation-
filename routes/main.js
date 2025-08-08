import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import fetchFeeds from '../utils/fetchFeeds.js';
import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { rssFeedUrl, sessionId } = req.body;

    if (!rssFeedUrl || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const articles = await fetchFeeds(rssFeedUrl, { maxAgeDays: 7, limit: 40 });
    const articleTextArray = articles.map(
      (a, i) => `${i + 1}. ${a.title} - ${a.summary}`
    );

    const inputPrompt = `Rewrite each AI news summary as a standalone podcast segment.

Tone: intelligent, sarcastic British Gen X — dry wit, cultural commentary, and confident delivery.

For each article:

Start with a dry joke or clever one-liner

Explain the topic clearly

Use natural phrasing

Avoid repetition

Here are the stories: ${articleTextArray.join('\n')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: inputPrompt }]
    });

    const chunks = completion.choices[0].message.content
      .split(/\n\n+/)
      .filter(Boolean)
      .map(chunk => chunk.trim());

    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });

    chunks.forEach((chunk, i) => {
      const filePath = path.join(storageDir, `raw-chunk-${i}.txt`);
      fs.writeFileSync(filePath, chunk);
    });

    await saveToMemory(sessionId, 'mainChunks', chunks);

    const chunkPaths = chunks.map((_, i) => `/mnt/data/${sessionId}/raw-chunk-${i}.txt`);

    res.json({
      sessionId,
      chunkPaths
    });

  } catch (err) {
    console.error('❌ Main route error:', err);
    res.status(500).json({ error: 'Podcast generation failed' });
  }
});

export default router;
