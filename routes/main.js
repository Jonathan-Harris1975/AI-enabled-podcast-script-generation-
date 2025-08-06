const express = require('express');
const router = express.Router();
const { storeSection } = require('../utils/memoryCache');
const Parser = require('rss-parser');

const parser = new Parser();

async function fetchRSSContent(feedUrl, limit = 3) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.slice(0, limit).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet
    }));
  } catch (err) {
    console.error('Failed to fetch RSS:', err);
    throw new Error('RSS fetch failed');
  }
}

router.post('/main', async (req, res) => {
  const { sessionId, date, rssUrl } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let content;
    if (rssUrl) {
      const articles = await fetchRSSContent(rssUrl, 3);
      content = `Main Section (from RSS):\n` + articles.map(a => `- ${a.title} (${a.link})`).join('\n');
    } else {
      content = `Generated main section for date ${date || 'N/A'}`;
    }

    storeSection(sessionId, 'main', content);
    res.json({ sessionId, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate main section' });
  }
});

module.exports = router;
