import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt
} from '../utils/podcastHelpers.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadToR2 from '../utils/uploadToR2.js';
import uploadChunksToR2 from '../utils/uploadchunksToR2.js';

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

    // List and read all chunk files
    const allFiles = fs.readdirSync(storageDir);
    const rawChunkFiles = allFiles
      .filter(f => f.startsWith('raw-chunk-'))
      .sort((a, b) => {
        const getNum = f => parseInt(f.match(/\d+/)[0], 10);
        return getNum(a) - getNum(b);
      });

    if (rawChunkFiles.length === 0) {
      return res.status(400).json({ error: 'No raw chunk files found' });
    }

    const mainChunks = rawChunkFiles.map(f => {
      const filePath = path.join(storageDir, f);
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      if (!content) throw new Error(`Empty chunk file: ${f}`);
      return content;
    });

    // Format all chunks
    const cleanedChunks = await Promise.all(
      [intro, ...mainChunks, outro].map(async chunk => {
        const edited = await editAndFormat(chunk);
        const safeEdited = typeof edited === 'string' ? edited : '';
        return safeEdited.replace(/\n+/g, ' ');
      })
    );

    // Join into one transcript
    const fullTranscript = cleanedChunks.join('\n\n');

    // Select tone
    const tones = ['cheeky', 'reflective', 'high-energy', 'dry as hell', 'overly sincere', 'witty', 'oddly poetic'];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    console.log(`🎙️ Selected tone: ${tone}`);

    // Save transcript locally
    const transcriptPath = path.join(storageDir, 'transcript.txt');
    fs.writeFileSync(transcriptPath, fullTranscript);

    // Upload transcript to R2
    const transcriptUrl = await uploadToR2(transcriptPath, `transcripts/${sessionId}.txt`);

    // Upload chunks to R2
    const chunkUrls = await uploadChunksToR2(cleanedChunks, sessionId);

    // Respond
    res.json({
      sessionId,
      tone,
      transcriptUrl,
      chunkUrls
    });

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final chunks', details: err.message });
  }
});

export default router;
