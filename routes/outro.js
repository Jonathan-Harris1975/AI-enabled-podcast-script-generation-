import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import { getOutroPromptFull } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const prompt = await getOutroPromptFull();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    // Get raw content and remove excessive newlines
    const rawOutro = completion.choices[0].message.content.trim();
    const finalOutro = rawOutro.replace(/\n+/g, ' ');

    // Save to disk
    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });
    const outroPath = path.join(storageDir, 'outro.txt');
    fs.writeFileSync(outroPath, finalOutro);

    res.json({
      sessionId,
      outroPath
    });

  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
