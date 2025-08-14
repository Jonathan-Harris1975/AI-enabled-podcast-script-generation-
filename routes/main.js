import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import fetchFeeds from '../utils/fetchFeeds.js';
import { saveToMemory } from '../utils/memoryCache.js';
import { getMainPrompt } from '../utils/promptTemplates.js';
import chunkText from '../utils/chunkText.js';

const router = express.Router();
const sessionsDir = path.resolve('./sessions');

router.post('/', async (req, res) => {
  try {
    const { rssFeedUrl, sessionId } = req.body;

    if (!rssFeedUrl || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Pull articles
    const articles = await fetchFeeds(rssFeedUrl, { maxAgeDays: 7, limit: 40 });
    if (!articles.length) {
      return res.status(404).json({ error: 'No articles found in feed' });
    }

    // Prepare article text
    const articleTextArray = articles.map(
      (a, i) => `${i + 1}. ${a.title} - ${a.summary}`
    );

    // Generate main podcast script
    const mainPrompt = getMainPrompt(articleTextArray);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: mainPrompt }]
    });

    const fullScript = completion.choices?.[0]?.message?.content?.trim();
    if (!fullScript) {
      return res.status(500).json({ error: 'Main script generation failed' });
    }

    // Chunk into TTS-friendly parts
    const chunks = chunkText(fullScript, 4800);

    // Ensure session folder exists
    const sessionFolder = path.join(sessionsDir, sessionId);
    fs.mkdirSync(sessionFolder, { recursive: true });

    // Save chunks to disk
    const chunkPaths = [];
    chunks.forEach((chunk, idx) => {
      const chunkFile = path.join(sessionFolder, `chunk_${idx + 1}.txt`);
      fs.writeFileSync(chunkFile, chunk, 'utf-8');
      chunkPaths.push(chunkFile);
    });

    // Save to memory
    await saveToMemory(sessionId, { chunks });

    res.json({
      sessionId,
      chunksPath: chunkPaths,
      chunks
    });
  } catch (err) {
    console.error('Main endpoint error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
