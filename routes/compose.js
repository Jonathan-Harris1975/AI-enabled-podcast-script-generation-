import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt
} from '../utils/podcastHelpers.js';
import editAndFormat from '../utils/editAndFormat.js';
import scriptComposer from '../utils/scriptComposer.js';
import splitPlainText from '../utils/splitPlainText.js';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const storageDir = path.resolve('/mnt/data', sessionId);
    const introPath = path.join(storageDir, 'intro.txt');
    const outroPath = path.join(storageDir, 'outro.txt');

    if (!fs.existsSync(introPath) || !fs.existsSync(outroPath)) {
      return res.status(400).json({ error: 'Intro or outro not found' });
    }

    const intro = fs.readFileSync(introPath, 'utf-8').trim();
    const outro = fs.readFileSync(outroPath, 'utf-8').trim();

    const mainChunks = fs
      .readdirSync(storageDir)
      .filter(f => f.startsWith('raw-chunk-'))
      .sort((a, b) => {
        const getNum = f => parseInt(f.match(/\d+/)[0], 10);
        return getNum(a) - getNum(b);
      })
      .map(f => fs.readFileSync(path.join(storageDir, f), 'utf-8').trim());

    const cleanedChunks = await Promise.all(
      [intro, ...mainChunks, outro].map(async chunk => {
        const edited = await editAndFormat(chunk);
        const safeEdited = typeof edited === 'string' ? edited : '';
        return safeEdited.replace(/\n+/g, ' ');
      })
    );

    const tones = ['cheeky', 'reflective', 'high-energy', 'dry as hell', 'overly sincere', 'Witty','oddly poetic'];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    console.log(`🎙️ Selected tone: ${tone}`);

    const output = {
      tone,
      chunks: cleanedChunks
    };

    const outputPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    res.json({ sessionId, ...output });

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final chunks' });
  }
});

export default router;
