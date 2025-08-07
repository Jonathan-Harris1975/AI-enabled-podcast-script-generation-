import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import { saveToMemory } from '../utils/memoryCache.js';
import { getOutroPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, hostName, sponsorText } = req.body;

    if (!sessionId || !hostName || !sponsorText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = getOutroPrompt({ hostName, sponsorText });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const outroText = completion.choices[0].message.content.trim();

    await saveToMemory(sessionId, 'outroText', outroText);

    const filePath = path.resolve('storage', sessionId, 'outro.txt');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, outroText, 'utf8');

    res.json({
      sessionId,
      outroPath: `storage/${sessionId}/outro.txt`
    });

  } catch (err) {
    console.error('❌ Outro route error:', err);
    res.status(500).json({ error: 'Outro generation failed' });
  }
});

export default router;
