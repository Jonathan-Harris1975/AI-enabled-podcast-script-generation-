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
    const introPrompt = getIntroPrompt({ weatherSummary, turingQuote });
    const mainPrompt = getMainPrompt(articleTextArray);
    const outroPrompt = await getOutroPromptFull();

    // Save results to persistent storage (disk)
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
