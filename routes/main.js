// routes/main.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import fetchFeeds from '../utils/fetchFeeds.js';
import { getMainPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { feedUrl, sessionId } = req.body;

    if (!feedUrl) {
      return res.status(400).json({ success: false, error: 'feedUrl is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    // Fetch RSS feed items
    const feedItems = await fetchFeeds(feedUrl);

    if (!feedItems.length) {
      return res.status(400).json({ success: false, error: 'No feed items found in the last 7 days' });
    }

    // Convert feed objects into plain strings for getMainPrompt
    const articleTextArray = feedItems.map(item => `${item.title}\n${item.summary}`);

    // Generate main prompt only
    const mainPrompt = getMainPrompt(articleTextArray);

    // Save results to disk in session-specific folder
    const outputDir = path.resolve('./podcastOutputs', sessionId);
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `mainPrompt_${timestamp}.txt`);

    await fs.writeFile(outputFile, mainPrompt, 'utf8');

    res.json({ success: true, file: outputFile, content: mainPrompt });
  } catch (err) {
    console.error('Error generating main prompt:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
