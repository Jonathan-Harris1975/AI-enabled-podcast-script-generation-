// routes/outro.js
import express from 'express';
import { openai } from '../utils/openai.js';
import { getOutroPrompt } from '../utils/promptTemplates.js';
import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = getOutroPrompt();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const outro = completion.choices[0].message.content.trim();

    const filePath = `storage/${sessionId}/outro.txt`;

    await saveToMemory(sessionId, 'outro', outro);

    res.json({
      sessionId,
      outroPath: filePath
    });
  } catch (err) {
    console.error('❌ Outro route error:', err);
    res.status(500).json({ error: 'Outro generation failed' });
  }
});

export default router;
