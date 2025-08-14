// routes/main.js

// Use named imports instead of default
import { getMainPrompt, getIntroPrompt, getOutroPromptFull } from '../utils/promptTemplates.js';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Example route to generate main podcast script
router.post('/generate', async (req, res) => {
  try {
    const { articleTextArray, weatherSummary, turingQuote } = req.body;

    // Generate prompts
    
    const mainPrompt = getMainPrompt(articleTextArray)
    

    // Save results to persistent storage (disk)
    const outputDir = path.resolve('./podcastOutputs');
    await fs.mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `podcast_${timestamp}.txt`);

    const fullContent = `${mainPrompt}`;
    await fs.writeFile(outputFile, fullContent, 'utf8');

    res.json({ success: true, file: outputFile, content: fullContent });
  } catch (err) {
    console.error('Error generating podcast:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
