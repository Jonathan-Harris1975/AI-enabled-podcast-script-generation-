import express from 'express';
import Parser from 'rss-parser';
import { openai } from '../services/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';

const router = express.Router();
const parser = new Parser();

// Default RSS feed if none provided in payload
const DEFAULT_RSS_URL = 'https://venturebeat.com/feed/';

router.post('/main', async (req, res) => {
  const { sessionId, rssUrl, maxItems = 6 } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // Pick feed URL from payload or fallback to default
    const feed = await parser.parseURL(rssUrl || DEFAULT_RSS_URL);

    // Extract up to maxItems and sanitize
    const segments = feed.items
      .slice(0, maxItems)
      .map(item =>
        sanitizeText(item.contentSnippet || item.content || item.title || '')
      )
      .filter(text => text.length > 10);

    if (segments.length === 0) {
      return res.status(400).json({ error: 'No valid articles found in feed' });
    }

    // Summarize each segment via OpenAI
    const results = [];
    for (const text of segments) {
      const resp = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content:
              'Write a shorter, witty podcast-length summary of the following segment—focus on AI and dry humour.'
          },
          { role: 'user', content: text }
        ]
      });
      const summary = sanitizeText(resp.choices[0].message.content);
      results.push(summary);
    }

    // Store in memory cache for later use in /compose
    storeSection(sessionId, 'main', results);

    // Return summaries
    res.json({ sessionId, result: results });
  } catch (err) {
    console.error('Main route error:', err.message);
    res.status(502).json({ error: 'Main fetch failed', details: err.message });
  }
});

export default router;
