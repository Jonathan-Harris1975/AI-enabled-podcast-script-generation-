// routes/main.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import fetchFeeds from '../utils/fetchFeeds.js';
import { getMainPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { feedUrl, sessionId } = req.body;

    if (!feedUrl) return res.status(400).json({ error: 'Missing feedUrl' });
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    // Fetch RSS items
    const feedItems = await fetchFeeds(feedUrl);
    if (!feedItems.length) {
      return res.status(400).json({ error: 'No feed items found in the last 7 days' });
    }

    // Base output folder: raw-text/raw-text/<sessionId>
    const outputDir = path.resolve('/opt/render/project/src/raw-text/raw-text', sessionId);
    fs.mkdirSync(outputDir, { recursive: true });

    // Determine starting chunk number (auto-increment if folder exists)
    const existingFiles = fs.readdirSync(outputDir)
      .filter(f => f.startsWith('chunk-') && f.endsWith('.txt'));
    let chunkNumber = existingFiles.length + 1;

    const filePaths = [];

    // Save each article as a separate chunk
    for (const item of feedItems) {
      const mainPrompt = getMainPrompt([`${item.title}\n${item.summary}`]);

      const fileName = `chunk-${chunkNumber}.txt`;
      const filePath = path.join(outputDir, fileName);

      fs.writeFileSync(filePath, mainPrompt, 'utf8');
      filePaths.push(filePath);

      chunkNumber++;
    }

    res.json({
      sessionId,
      files: filePaths
    });

  } catch (err) {
    console.error('❌ Main prompt generation failed:', err);
    res.status(500).json({ error: 'Failed to generate main prompts' });
  }
});

export default router;
