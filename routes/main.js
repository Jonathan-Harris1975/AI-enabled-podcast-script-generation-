import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, rssFeedUrl } = req.body;

    if (!sessionId || !rssFeedUrl) {
      return res.status(400).json({ error: 'Missing sessionId or rssFeedUrl' });
    }

    // Fetch RSS feed
    const rssResponse = await fetch(rssFeedUrl);
    const rssXml = await rssResponse.text();

    // Parse RSS
    const parser = new xml2js.Parser();
    const rssData = await parser.parseStringPromise(rssXml);

    // Example: create main text from titles + descriptions of the first few items
    const items = rssData.rss.channel[0].item || [];
    let mainText = 'Latest updates from the RSS feed:\n\n';
    items.slice(0, 5).forEach((item, idx) => {
      const title = item.title ? item.title[0] : 'No title';
      const description = item.description ? item.description[0] : 'No description';
      mainText += `${idx + 1}. ${title}\n${description}\n\n`;
    });

    // Save to persistent disk
    const sessionDir = path.resolve('/mnt/data', sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    fs.writeFileSync(path.join(sessionDir, 'main.txt'), mainText, 'utf-8');

    res.json({
      status: 'success',
      file: `/mnt/data/${sessionId}/main.txt`
    });
  } catch (error) {
    console.error('Error generating main section:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
