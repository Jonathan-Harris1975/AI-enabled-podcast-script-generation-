import express from 'express';
import path from 'path';
import { openai } from '../utils/openai.js';
import { clearMemory, saveToMemory } from '../utils/memoryCache.js';
import { getIntroPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, date, episode, reset } = req.body;

    if (!sessionId || !date || !episode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (reset && reset === 'Y') {
      await clearMemory(sessionId);
    }

    // Get base intro prompt
    const basePrompt = getIntroPrompt(date, episode);

    // Add clear instruction to actually generate content
    const fullPrompt = `${basePrompt}\n\nGenerate the full SSML-formatted intro as per requirements, do not repeat this prompt text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const introText = completion.choices?.[0]?.message?.content?.trim();
    if (!introText) {
      return res.status(500).json({ error: 'Intro generation failed' });
    }

    // Store intro in session memory
    await saveToMemory(sessionId, { intro: introText });

    res.json({
      sessionId,
      introPath: `${sessionId}/intro.txt`,
      intro: introText
    });
  } catch (err) {
    console.error('Intro error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
