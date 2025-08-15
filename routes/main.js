import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
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

    // Create session directory in persistent storage
    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });

    // Determine starting chunk number
    const existingFiles = fs.readdirSync(storageDir)
      .filter(f => f.startsWith('chunk-') && f.endsWith('.txt'));
    let chunkNumber = existingFiles.length + 1;

    const filePaths = [];

    // Process each feed item
    for (const item of feedItems) {
      const mainPrompt = getMainPrompt([`${item.title}\n${item.summary}`]);

      // Get completion from OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.75,
        messages: [{ role: 'user', content: mainPrompt }]
      });

      const content = completion.choices[0].message.content.trim();

      // Save the completion result (not just the prompt)
      const fileName = `chunk-${chunkNumber}.txt`;
      const filePath = path.join(storageDir, fileName);
      fs.writeFileSync(filePath, content, 'utf8');
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
