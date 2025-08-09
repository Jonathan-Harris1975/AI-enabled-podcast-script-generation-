import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import chunkText from '../utils/chunkText.js';
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

    let rawOutro = completion.choices[0].message.content.trim();

    // Process the raw outro text with chunkText if needed
    // Note: You might want to adjust this based on how chunkText should be used
    const processedOutro = await chunkText(rawOutro);

    // Remove line breaks (flatten to single paragraph)
    const finalOutro = processedOutro.replace(/\n+/g, ' ');

    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(path.join(storageDir, 'outro.txt'), finalOutro);

    res.json({
      sessionId,
      outroPath: `${storageDir}/outro.txt`
    });
  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
