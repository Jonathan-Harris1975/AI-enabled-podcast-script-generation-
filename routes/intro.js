// routes/intro.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import { getIntroPrompt, selectedTone } from '../utils/promptTemplates.js';
import getWeatherSummary from '../utils/getWeatherSummary.js';
import getTuringQuote from '../utils/getTuringQuote.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Get dynamic content for intro
    const weatherSummary = await getWeatherSummary();
    const turingQuote = await getTuringQuote();

    // Build intro prompt from templates with consistent tone
    const inputPrompt = getIntroPrompt({
      hostName: 'Jonathan Harris',
      weatherSummary,
      turingQuote
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: inputPrompt }]
    });

    let rawIntro = completion.choices[0].message.content.trim();
    rawIntro = rawIntro.replace(/\n+/g, ' '); // remove paragraphs

    // Save locally
    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(path.join(storageDir, 'intro.txt'), rawIntro);

    res.json({
      sessionId,
      tone: selectedTone,
      introPath: `${storageDir}/intro.txt`
    });

  } catch (err) {
    console.error('❌ Intro generation failed:', err);
    res.status(500).json({ error: 'Failed to generate intro', details: err.message });
  }
});

export default router;
