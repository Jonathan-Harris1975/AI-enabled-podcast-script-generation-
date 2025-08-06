import express from 'express';
import memoryCache from '../utils/memoryCache.js';
import fetchFeed from '../utils/fetchFeed.js';
import { callOpenAI } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, rssUrl, maxAgeDays = 7 } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });
    if (!rssUrl) return res.status(400).json({ error: 'rssUrl is required' });

    // Fetch and filter RSS
    const articles = await fetchFeed(rssUrl, maxAgeDays);
    const limitedArticles = articles.slice(0, 40);

    const systemPrompt = `Summarise the following AI news articles in a cohesive narrative suitable for the 
      middle section of a podcast. Use a British Gen X tone. Articles:\n${JSON.stringify(limitedArticles)}`;

    const mainContent = await callOpenAI(systemPrompt);

    // Cache
    memoryCache.storeSection(sessionId, 'main', mainContent);

    res.json({ sessionId, main: mainContent, articleCount: limitedArticles.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate main content' });
  }
});

export default router;
