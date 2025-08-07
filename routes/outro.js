// routes/outro.js
import express from 'express';
import { openai } from '../utils/openai.js';
import { saveToMemory } from '../utils/memoryCache.js';
import { formatPrompt } from '../utils/promptFormatter.js';

const router = express.Router();

/**
 * Generates plain-text outro chunks and saves them
 * Input: { sessionId: 'TT-2025-08-07' }
 */
router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🎤 Generating plain-text outro...');

    const prompt = formatPrompt({
      type: 'outro',
      date: new Date().toISOString().split('T')[0]
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const message = completion.choices[0].message.content.trim();

    // Break into chunks (simulate ~4800 char limit)
    const maxLength = 4800;
    const chunks = [];
    for (let i = 0; i < message.length; i += maxLength) {
      chunks.push(message.slice(i, i + maxLength).replace(/\n/g, ' ').trim());
    }

    await saveToMemory(`${sessionId}/outro-tts.json`, JSON.stringify(chunks));
    await saveToMemory(`${sessionId}/outro.txt`, message);

    res.json({
      sessionId,
      outroPath: `${sessionId}/outro.txt`,
      ttsChunksPath: `${sessionId}/outro-tts.json`
    });
  } catch (err) {
    console.error('❌ Outro route error:', err);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
