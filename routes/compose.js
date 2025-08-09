import express from 'express';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { URL } from 'url';
import uploadChunksToR2 from '../utils/uploadchunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import editAndFormat from '../utils/editAndFormat.js';
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

// Load books data using Node.js compatible method
const booksData = JSON.parse(
  readFileSync(new URL('../data/books.json', import.meta.url))
);
const books = () => booksData[Math.floor(Math.random() * booksData.length)];

const router = express.Router();

// Configurable storage directory (Render compatible)
const STORAGE_BASE = process.env.STORAGE_DIR || resolve('data');
const MAX_CHUNKS = process.env.MAX_CHUNKS || 20;

// Helper functions
const safeRead = (filePath) => {
  try {
    return readFileSync(filePath, 'utf-8').trim();
  } catch (err) {
    console.error(`File read error (${filePath}):`, err.message);
    throw new Error(`Failed to read: ${filePath.split('/').pop()}`);
  }
};

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
        error: 'Invalid sessionId - only alphanumeric, dash and underscore allowed'
      });
    }

    const sessionDir = join(STORAGE_BASE, sessionId);

    // Verify session directory exists
    if (!existsSync(sessionDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Load content files
    let intro, outro;
    try {
      intro = safeRead(join(sessionDir, 'intro.txt'));
      const outroContent = existsSync(join(sessionDir, 'outro.txt'))
        ? safeRead(join(sessionDir, 'outro.txt'))
        : 'Thanks for listening!';
      outro = `${outroContent}\n\n📚 Check out "${books().title}" at ${books().url}`;
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Process chunks
    let chunkFiles;
    try {
      chunkFiles = readdirSync(sessionDir)
        .filter(f => f.startsWith('raw-chunk-') && f.endsWith('.txt'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0], 10);
          const numB = parseInt(b.match(/\d+/)[0], 10);
          return numA - numB;
        })
        .slice(0, MAX_CHUNKS);
    } catch (err) {
      console.error('Directory read error:', err);
      return res.status(500).json({ error: 'Failed to process chunks' });
    }

    // Format chunks
    let formattedChunks;
    try {
      formattedChunks = await Promise.all(
        chunkFiles.map(async (file) => {
          const content = safeRead(join(sessionDir, file));
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
        const chunkPath = join(sessionDir, `processed-chunk-${index}.txt`);
        writeFileSync(chunkPath, chunk);
        return uploadChunksToR2(
          chunkPath,
          `chunks/${sessionId}/chunk-${index}.txt`
        );
      });

      // Upload transcript
      const transcriptPath = join(sessionDir, 'final-transcript.txt');
      writeFileSync(transcriptPath, cleanedTranscript);
      uploadPromises.push(
        uploadToR2(
          transcriptPath,
          `transcripts/${sessionId}/transcript.txt`
        )
      );

      // Generate metadata in parallel
      const metadataPromises = [
        getTitleDescriptionPrompt(cleanedTranscript),
        getSEOKeywordsPrompt(cleanedTranscript),
        getArtworkPrompt(cleanedTranscript)
      ];

      const [
        ttsChunkUrls,
        transcriptUrl,
        [title, keywords, artworkPrompt]
      ] = await Promise.all([
        Promise.all(uploadPromises.slice(0, -1)),
        uploadPromises[uploadPromises.length - 1],
        Promise.all(metadataPromises)
      ]);

      // Prepare response
      const tones = [
        'cheeky', 'reflective', 'high-energy',
        'dry', 'sincere', 'witty', 'poetic'
      ];

      return res.json({
        success: true,
        sessionId,
        metadata: {
          title: formatTitle(title),
          description: title, // Reuse title as description
          keywords: normaliseKeywords(keywords),
          artworkPrompt,
          tone: tones[Math.floor(Math.random() * tones.length)]
        },
        sponsor: books(),
        urls: {
          transcript: transcriptUrl,
          chunks: ttsChunkUrls
        },
        transcript: cleanedTranscript
      });

    } catch (uploadErr) {
      console.error('Upload failed:', uploadErr.stack || uploadErr);
      return res.status(500).json({ error: 'Asset upload failed' });
    }

  } catch (err) {
    console.error('Server error:', err.stack || err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;
