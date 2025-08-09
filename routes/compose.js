import express from 'express';
import fs from 'fs';
import path from 'path';
import uploadchunksToR2 from '../utils/uploadchunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import editAndFormat from '../utils/editAndFormat.js';
import {books} from '../utils/books.js';
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

    if (!fs.existsSync(introPath)) {
      return res.status(400).json({ error: 'Intro not found' });
    }

    // Get random book sponsor
    const sponsor = books();
    const sponsorOutro = `\n\n📚 Check out "${sponsor.title}" at ${sponsor.url}`;

    // Load intro and outro (inject sponsor into outro if exists)
    const intro = fs.readFileSync(introPath, 'utf-8').trim();
    let outro = fs.existsSync(outroPath)
      ? fs.readFileSync(outroPath, 'utf-8').trim()
      : 'Thanks for listening!';
    outro += sponsorOutro;

    // Read main raw chunks
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

    // Merge into final chunks array
    const finalChunks = [intro, ...formattedMainChunks, outro];

    // Upload each chunk to R2 (chunks bucket) and collect URLs
    const ttsChunkUrls = await Promise.all(
      finalChunks.map(async (chunk, index) => {
        const localPath = path.join(storageDir, `chunk-${index}.txt`);
        fs.writeFileSync(localPath, chunk);
        const r2Url = await uploadChunksToR2(localPath, `raw-text/${sessionId}/chunk-${index}.txt`);
        return r2Url;
      })
    );

    // Build & clean full transcript
    const fullTranscript = finalChunks.join('\n\n');
    const cleanedTranscript = cleanTranscript(fullTranscript);

    // Save transcript locally and upload to transcripts bucket
    const transcriptPath = path.join(storageDir, 'transcript.txt');
    fs.writeFileSync(transcriptPath, cleanedTranscript);
    const transcriptUrl = await uploadToR2(transcriptPath, `transcripts/${sessionId}/transcript.txt`);

    // Generate episode metadata
    const titleRaw = await getTitleDescriptionPrompt(cleanedTranscript);
    const description = await getTitleDescriptionPrompt(cleanedTranscript);
    const keywordsRaw = await getSEOKeywordsPrompt(cleanedTranscript);
    const artworkPrompt = await getArtworkPrompt(cleanedTranscript);

    const tones = [
      'cheeky',
      'reflective',
      'high-energy',
      'dry as hell',
      'overly sincere',
      'witty',
      'oddly poetic'
    ];
    const tone = tones[Math.floor(Math.random() * tones.length)];

    // Build response
    const output = {
      sessionId,
      tone,
      title: formatTitle(titleRaw),
      description,
      keywords: normaliseKeywords(keywordsRaw),
      artworkPrompt,
      sponsor,
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
