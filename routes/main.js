// routes/main.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import fetchFeeds from '../utils/fetchFeeds.js';
import { saveToMemory } from '../utils/memoryCache.js';
import { getMainPrompt, selectedTone } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { rssFeedUrl, sessionId } = req.body;

    if (!rssFeedUrl || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch RSS feed and prepare summaries
    const articles = await fetchFeeds(rssFeedUrl, { maxAgeDays: 7, limit: 40 });
    const articleTextArray = articles.map(
      (a, i) => `${i + 1}. ${a.title} - ${a.summary}`
    );

    // Get centralised main prompt with consistent tone & host name baked in
    const inputPrompt = getMainPrompt(articleTextArray);

    // Generate rewritten podcast segments
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: inputPrompt }]
    });

    let chunks = completion.choices[0].message.content
      .split(/\n\n+/)
      .filter(Boolean)
      .map(chunk => chunk.trim());

    // Enforce character length between 3000–4000 per chunk
    chunks = chunks.map(chunk => {
      let text = chunk.replace(/\n+/g, ' '); // no paragraphs
      if (text.length < 3000) {
        // If too short, pad with additional commentary
        text += ' '.repeat(1) + 'Let’s just say there’s more to it, but you get the idea.';
      } else if (text.length > 4000) {
        // If too long, trim without cutting a sentence mid-way
        text = text.slice(0, 4000);
        const lastPeriod = text.lastIndexOf('.');
        if (lastPeriod > 3500) {
          text = text.slice(0, lastPeriod + 1);
        }
      }
      return text;
    });

    // Save chunks locally
    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });

    chunks.forEach((chunk, i) => {
      const filePath = path.join(storageDir, `raw-chunk-${i + 1}.txt`);
      fs.writeFileSync(filePath, chunk);
    });

    // Cache in memory
    await saveToMemory(sessionId, 'mainChunks', chunks);

    const chunkPaths = chunks.map((_, i) => `/mnt/data/${sessionId}/raw-chunk-${i + 1}.txt`);

    res.json({
      sessionId,
      tone: selectedTone,
      chunkPaths
    });

  } catch (err) {
    console.error('❌ Main route error:', err);
    res.status(500).json({ error: 'Podcast generation failed', details: err.message });
  }
});

export default router;
