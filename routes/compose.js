import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadchunksToR2 from '../utils/uploadchunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import editAndFormat from '../utils/editAndFormat.js';
import getRandomSponsor from '../utils/books.js';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt,
} from '../utils/podcastHelpers.js';
import {
  cleanTranscript,
  formatTitle,
  normaliseKeywords,
} from '../utils/textHelpers.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_BASE = path.join(__dirname, '..', 'data'); // Portable storage path
const MAX_CHUNKS = 100; // Limit to prevent abuse

// Validate sessionId to prevent path traversal
const validateSessionId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[a-z0-9-_]+$/i.test(id);
};

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Validate input
    if (!validateSessionId(sessionId)) {
      return res.status(400).json({
        error: 'Invalid sessionId - only alphanumeric, dash, and underscore allowed',
      });
    }

    const sessionDir = path.join(STORAGE_BASE, sessionId);

    // Verify session directory exists
    try {
      await fs.access(sessionDir);
    } catch {
      return res.status(404).json({ error: 'Session directory not found' });
    }

    // Load content files
    let intro, outro;
    try {
      intro = (await fs.readFile(path.join(sessionDir, 'intro.txt'), 'utf-8')).trim();
      const outroPath = path.join(sessionDir, 'outro.txt');
      outro = (await fs.access(outroPath)
        .then(() => fs.readFile(outroPath, 'utf-8'))
        .catch(() => 'Thanks for listening!')
      ).trim();
    } catch (err) {
      return res.status(400).json({ error: 'Failed to read intro or outro files' });
    }

    // Append sponsor to outro
    const sponsor = getRandomSponsor();
    outro += `\n\n📚 Check out "${sponsor.title}" at ${sponsor.url}`;

    // Process raw chunks
    let chunkFiles;
    try {
      chunkFiles = (await fs.readdir(sessionDir))
        .filter((f) => f.startsWith('raw-chunk-') && f.endsWith('.txt'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0], 10);
          const numB = parseInt(b.match(/\d+/)[0], 10);
          return numA - numB;
        })
        .slice(0, MAX_CHUNKS);
    } catch (err) {
      console.error('Directory read error:', err);
      return res.status(500).json({ error: 'Failed to read chunk files' });
    }

    // Format chunks
    let formattedChunks;
    try {
      formattedChunks = await Promise.all(
        chunkFiles.map(async (file) => {
          const content = (await fs.readFile(path.join(sessionDir, file), 'utf-8')).trim();
          const formatted = await editAndFormat(content);
          if (!formatted || typeof formatted !== 'string') {
            throw new Error(`Invalid chunk format: ${file}`);
          }
          return formatted.trim();
        })
      );
    } catch (err) {
      console.error('Chunk formatting error:', err);
      return res.status(500).json({ error: 'Content formatting failed' });
    }

    // Compose final content
    const finalChunks = [intro, ...formattedChunks, outro];
    const fullTranscript = finalChunks.join('\n\n');
    const cleanedTranscript = cleanTranscript(fullTranscript);

    // Upload assets
    try {
      // Upload individual chunks
      const uploadPromises = finalChunks.map(async (chunk, index) => {
        const chunkPath = path.join(sessionDir, `processed-chunk-${index}.txt`);
        await fs.writeFile(chunkPath, chunk);
        return uploadChunksToR2(chunkPath, `chunks/${sessionId}/chunk-${index}.txt`);
      });

      // Upload transcript
      const transcriptPath = path.join(sessionDir, 'final-transcript.txt');
      await fs.writeFile(transcriptPath, cleanedTranscript);
      uploadPromises.push(
        uploadToR2(transcriptPath, `transcripts/${sessionId}/transcript.txt`)
      );

      // Generate metadata in parallel
      const metadataPromises = [
        getTitleDescriptionPrompt(cleanedTranscript), // Title
        getTitleDescriptionPrompt(cleanedTranscript), // Description
        getSEOKeywordsPrompt(cleanedTranscript),
        getArtworkPrompt(cleanedTranscript),
      ];

      const [ttsChunkUrls, transcriptUrl, [title, description, keywords, artworkPrompt]] =
        await Promise.all([
          Promise.all(uploadPromises.slice(0, -1)),
          uploadPromises[uploadPromises.length - 1],
          Promise.all(metadataPromises),
        ]);

      // Prepare response
      const tones = [
        'cheeky',
        'reflective',
        'high-energy',
        'dry',
        'sincere',
        'witty',
        'poetic',
      ];
      const tone = tones[Math.floor(Math.random() * tones.length)];

      return res.json({
        success: true,
        sessionId,
        metadata: {
          title: formatTitle(title),
          description,
          keywords: normaliseKeywords(keywords),
          artworkPrompt,
          tone,
        },
        sponsor,
        urls: {
          transcript: transcriptUrl,
          chunks: ttsChunkUrls,
        },
        transcript: cleanedTranscript,
      });
    } catch (uploadErr) {
      console.error('Upload failed:', uploadErr);
      return res.status(500).json({ error: 'Asset upload failed' });
    }
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

export default router;
