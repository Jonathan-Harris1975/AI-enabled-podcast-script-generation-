import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { cleanTranscript, chunkText, formatTitle, normaliseKeywords } from '../utils/editAndFormat.js';
import uploadToR2 from '../utils/uploadToR2.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) throw new Error('No sessionId provided');

    const storageDir = path.join('storage', sessionId);

    // Load required content
    const intro = await fs.readFile(path.join(storageDir, 'intro.txt'), 'utf8');
    const main = await fs.readFile(path.join(storageDir, 'main.txt'), 'utf8');
    const outroJson = JSON.parse(await fs.readFile(path.join(storageDir, 'outro.json'), 'utf8'));
    const outro = Object.values(outroJson).join('\n\n');

    const transcript = cleanTranscript(`${intro.trim()}\n\n${main.trim()}\n\n${outro}`);
    const ttsChunks = chunkText(transcript);

    const titleRaw = await fs.readFile(path.join(storageDir, 'title.txt'), 'utf8');
    const descriptionRaw = await fs.readFile(path.join(storageDir, 'description.txt'), 'utf8');
    const keywordsRaw = await fs.readFile(path.join(storageDir, 'keywords.txt'), 'utf8');
    const artPromptRaw = await fs.readFile(path.join(storageDir, 'artPrompt.txt'), 'utf8');

    const payload = {
      transcript,
      ttsChunks,
      title: formatTitle(titleRaw),
      description: descriptionRaw.trim(),
      keywords: normaliseKeywords(keywordsRaw),
      artPrompt: artPromptRaw.trim()
    };

    // Upload transcript to R2
    const transcriptKey = `${sessionId}.txt`;
    const url = await uploadToR2(transcriptKey, transcript);

    res.status(200).json({ url, ...payload });

  } catch (err) {
    console.error('❌ Compose error:', err.message);
    res.status(500).json({ error: 'Failed to generate full podcast output.' });
  }
});

export default router;
