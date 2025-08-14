// routes/main.js
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import fetchFeeds from '../utils/fetchFeeds.js';
import { getMainPrompt, getIntroPrompt, getOutroPromptFull } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { feedUrl, weatherSummary, turingQuote } = req.body;

    if (!feedUrl) {
      return res.status(400).json({ success: false, error: 'feedUrl is required' });
    }

    // Fetch RSS feed items
    const feedItems = await fetchFeeds(feedUrl);

    if (!feedItems.length) {
      return res.status(400).json({ success: false, error: 'No feed items found in the last 7 days' });
    }

    // Convert feed objects into plain strings for getMainPrompt
    const articleTextArray = feedItems.map(item => `${item.title}\n${item.summary}`);

    // Generate prompts
    const introPrompt = getIntroPrompt({ weatherSummary: weatherSummary || 'the usual British drizzle', turingQuote: turingQuote || 'Machines take me by surprise with great frequency.' });
    const mainPrompt = getMainPrompt(articleTextArray);
    const outroPrompt = await getOutroPromptFull();

    // Save results to disk
    const outputDir = path.resolve('./podcastOutputs');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `podcast_${timestamp}.txt`);

    const fullContent = `${introPrompt}\n\n${mainPrompt}\n\n${outroPrompt}`;
    await fs.writeFile(outputFile, fullContent, 'utf8');

    res.json({ success: true, file: outputFile, content: fullContent });
  } catch (err) {
    console.error('Error generating podcast:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
