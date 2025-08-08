import express from 'express';
import fs from 'fs';
import path from 'path';
import { uploadchunksToR2 } from '../utils/uploadchunksToR2.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadToR2 from '../utils/uploadToR2.js';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt
} from '../utils/podcastHelpers.js';
import {
  cleanTranscript,
  formatTitle,
  normaliseKeywords
} from '../utils/textHelpers.js';

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

    // Apply editAndFormat only to main chunks
    const formattedMainChunks = await Promise.all(
      mainChunks.map(async chunk => {
        const edited = await editAndFormat(chunk);
        return typeof edited === 'string' ? edited.trim() : '';
      })
    );

    // Merge all into final chunks
    const finalChunks = [intro, ...formattedMainChunks, outro];

    // Upload each chunk to R2 and collect URLs
    const ttsChunkUrls = await Promise.all(
      finalChunks.map(async (chunk, index) => {
        const localPath = path.join(storageDir, `chunk-${index}.txt`);
        fs.writeFileSync(localPath, chunk);
        const r2Url = await uploadchunksToR2 (localPath, `raw-text/${sessionId}/chunk-${index}.txt`);
        return r2Url;
      })
    );

    // Build and clean full transcript
    const fullTranscript = finalChunks.join('\n\n');
    const cleanedTranscript = cleanTranscript(fullTranscript);

    // Save transcript and upload to R2
    const transcriptPath = path.join(storageDir, 'transcript.txt');
    fs.writeFileSync(transcriptPath, cleanedTranscript);
    const transcriptUrl = await uploadToR2(transcriptPath, `transcripts/${sessionId}/transcript.txt`);

    // Generate episode metadata
    const titleRaw = await getTitleDescriptionPrompt(cleanedTranscript);
    const description = await getTitleDescriptionPrompt(cleanedTranscript);
    const keywordsRaw = await getSEOKeywordsPrompt(cleanedTranscript);
    const artworkPrompt = await getArtworkPrompt(cleanedTranscript);

    const tones = ['cheeky', 'reflective', 'high-energy', 'dry as hell', 'overly sincere', 'witty', 'oddly poetic'];
    const tone = tones[Math.floor(Math.random() * tones.length)];

    const output = {
      sessionId,
      tone,
      title: formatTitle(titleRaw),
      description,
      keywords: normaliseKeywords(keywordsRaw),
      artworkPrompt,
      transcript: cleanedTranscript,
      transcriptUrl,
      ttsChunks: ttsChunkUrls
    };

    res.json(output);

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final chunks' });
  }
});

export default router;
