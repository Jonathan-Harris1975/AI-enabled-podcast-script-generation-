import express from 'express';
import fs from 'fs';
import path from 'path';
import uploadChunksToR2 from '../utils/uploadchunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import editAndFormat from '../utils/editAndFormat.js';
import { books } from '../utils/books.js';
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

// Environment configuration
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'data');
const MAX_CHUNKS = process.env.MAX_CHUNKS ? parseInt(process.env.MAX_CHUNKS) : 20;

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Validate input
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Invalid sessionId' });
    }

    // Security: Prevent directory traversal
    if (/[^a-z0-9\-_]/i.test(sessionId)) {
      return res.status(400).json({ error: 'Invalid sessionId format' });
    }

    const sessionDir = path.join(STORAGE_DIR, sessionId);

    // Check if session directory exists
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Helper function for safe file operations
    const readFileSafe = (filePath) => {
      try {
        return fs.readFileSync(filePath, 'utf-8').trim();
      } catch (err) {
        console.error(`Error reading ${path.basename(filePath)}:`, err.message);
        throw new Error(`Failed to read ${path.basename(filePath)}`);
      }
    };

    // Load content files
    let intro, outro;
    try {
      intro = readFileSafe(path.join(sessionDir, 'intro.txt'));
      outro = readFileSafe(path.join(sessionDir, 'outro.txt')) + 
              `\n\n📚 Check out "${books().title}" at ${books().url}`;
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Process main chunks
    let mainChunks;
    try {
      mainChunks = fs.readdirSync(sessionDir)
        .filter(f => f.startsWith('raw-chunk-') && f.endsWith('.txt'))
        .slice(0, MAX_CHUNKS)  // Limit number of chunks
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0], 10);
          const numB = parseInt(b.match(/\d+/)[0], 10);
          return numA - numB;
        })
        .map(f => readFileSafe(path.join(sessionDir, f)));
    } catch (err) {
      console.error('Error processing chunks:', err);
      return res.status(500).json({ error: 'Failed to process content chunks' });
    }

    // Format chunks
    let formattedChunks;
    try {
      formattedChunks = await Promise.all(
        mainChunks.map(async (chunk, index) => {
          const edited = await editAndFormat(chunk);
          if (!edited || typeof edited !== 'string') {
            throw new Error(`Invalid format for chunk ${index}`);
          }
          return edited.trim();
        })
      );
    } catch (err) {
      console.error('Error formatting chunks:', err);
      return res.status(500).json({ error: 'Failed to format content' });
    }

    // Compose final content
    const finalChunks = [intro, ...formattedChunks, outro];
    const fullTranscript = finalChunks.join('\n\n');
    const cleanedTranscript = cleanTranscript(fullTranscript);

    // Upload assets
    try {
      // Upload chunks
      const ttsChunkUrls = await Promise.all(
        finalChunks.map(async (chunk, index) => {
          const chunkPath = path.join(sessionDir, `chunk-${index}.txt`);
          fs.writeFileSync(chunkPath, chunk);
          return await uploadChunksToR2(
            chunkPath,
            `raw-text/${sessionId}/chunk-${index}.txt`
          );
        })
      );

      // Upload transcript
      const transcriptPath = path.join(sessionDir, 'transcript.txt');
      fs.writeFileSync(transcriptPath, cleanedTranscript);
      const transcriptUrl = await uploadToR2(
        transcriptPath,
        `transcripts/${sessionId}/transcript.txt`
      );

      // Generate metadata
      const [titleRaw, description, keywordsRaw, artworkPrompt] = await Promise.all([
        getTitleDescriptionPrompt(cleanedTranscript),
        getTitleDescriptionPrompt(cleanedTranscript),
        getSEOKeywordsPrompt(cleanedTranscript),
        getArtworkPrompt(cleanedTranscript)
      ]);

      const tones = [
        'cheeky', 'reflective', 'high-energy', 
        'dry as hell', 'overly sincere', 'witty', 'oddly poetic'
      ];

      return res.json({
        sessionId,
        tone: tones[Math.floor(Math.random() * tones.length)],
        title: formatTitle(titleRaw),
        description,
        keywords: normaliseKeywords(keywordsRaw),
        artworkPrompt,
        sponsor: books(),
        transcript: cleanedTranscript,
        transcriptUrl,
        ttsChunks: ttsChunkUrls
      });

    } catch (err) {
      console.error('Upload error:', err.stack || err);
      return res.status(500).json({ error: 'Failed to upload assets' });
    }

  } catch (err) {
    console.error('Server error:', err.stack || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
