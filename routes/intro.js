// routes/intro.js
import express from 'express';
import { openai } from '../utils/openai.js';
import { saveToMemory, clearMemory } from '../utils/memoryCache.js';
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

    const prompt = getIntroPrompt(date, episode);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const intro = completion.choices[0].message.content.trim();
    const filePath = `storage/${sessionId}/intro.txt`;

    await saveToMemory(sessionId, 'intro', intro);

    res.json({
      sessionId,
      introPath: filePath
    });
  } catch (err) {
    console.error('❌ Intro route error:', err);
    res.status(500).json({ error: 'Intro generation failed' });
  }
});

export default router;
