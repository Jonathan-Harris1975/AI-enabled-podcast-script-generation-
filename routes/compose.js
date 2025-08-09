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
const STORAGE_BASE = path.resolve(__dirname, '..', 'data'); // Absolute path
const MAX_CHUNKS = 100;

// Enhanced session ID validation
const validateSessionId = (id) => {
  if (!id || typeof id !== 'string' || id.length > 64) return false;
  return /^[a-z0-9-]+$/i.test(id); // Simplified pattern
};

// Initialize storage directory
const initStorage = async () => {
  try {
    await fs.mkdir(STORAGE_BASE, { recursive: true });
    console.log(`Storage initialized at: ${STORAGE_BASE}`);
  } catch (err) {
    console.error('Storage initialization failed:', err);
    process.exit(1);
  }
};

// Call initialization
initStorage().catch(console.error);

router.post('/', async (req, res) => {
  const startTime = Date.now();
  let sessionDir;

  try {
    const { sessionId } = req.body;

    // Validate input
    if (!validateSessionId(sessionId)) {
      console.warn(`Invalid sessionId: ${sessionId}`);
      return res.status(400).json({
        error: 'Invalid sessionId - only alphanumeric and dash characters allowed (max 64 chars)',
      });
    }

    sessionDir = path.join(STORAGE_BASE, sessionId);
    console.log(`Processing session: ${sessionId}`);

    // Verify session directory exists and is accessible
    try {
      await fs.access(sessionDir);
      const stats = await fs.stat(sessionDir);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }
    } catch (err) {
      console.error(`Session directory access error: ${sessionDir}`, err);
      return res.status(404).json({ 
        error: 'Session not found',
        details: process.env.NODE_ENV === 'development' ? `Path: ${sessionDir}` : undefined
      });
    }

    // Load content files with improved error handling
    let intro, outro;
    try {
      [intro, outro] = await Promise.all([
        fs.readFile(path.join(sessionDir, 'intro.txt'), 'utf-8'),
        fs.readFile(path.join(sessionDir, 'outro.txt'), 'utf-8').catch(() => 'Thanks for listening!')
      ]).then(([i, o]) => [i.trim(), o.trim()]);
    } catch (err) {
      console.error('Content file read error:', err);
      return res.status(400).json({ 
        error: 'Missing required content files',
        required: ['intro.txt'],
        optional: ['outro.txt']
      });
    }

    // Append sponsor
    const sponsor = getRandomSponsor();
    outro += `\n\n📚 Check out "${sponsor.title}" at ${sponsor.url}`;

    // Process chunks with better sorting and validation
    let chunkFiles;
    try {
      const allFiles = await fs.readdir(sessionDir);
      chunkFiles = allFiles
        .filter(f => /^raw-chunk-\d+\.txt$/i.test(f))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)[0], 10);
          const numB = parseInt(b.match(/\d+/)[0], 10);
          return numA - numB;
        })
        .slice(0, MAX_CHUNKS);

      if (chunkFiles.length === 0) {
        throw new Error('No valid chunk files found');
      }
    } catch (err) {
      console.error('Chunk processing error:', err);
      return res.status(400).json({ 
        error: 'Invalid chunk files',
        expectedFormat: 'raw-chunk-{number}.txt'
      });
    }

    // Format chunks with progress tracking
    let formattedChunks;
    try {
      console.log(`Formatting ${chunkFiles.length} chunks...`);
      formattedChunks = await Promise.all(
        chunkFiles.map(async (file, index) => {
          const content = await fs.readFile(path.join(sessionDir, file), 'utf-8');
          const formatted = await editAndFormat(content.trim());
          if (!formatted?.trim()) {
            throw new Error(`Empty result for chunk ${file}`);
          }
          console.log(`Formatted chunk ${index + 1}/${chunkFiles.length}`);
          return formatted.trim();
        })
      );
    } catch (err) {
      console.error('Chunk formatting failed:', err);
      return res.status(500).json({ 
        error: 'Content formatting failed',
        failedChunk: err.message.includes('chunk') ? err.message : undefined
      });
    }

    // Compose final content
    const finalChunks = [intro, ...formattedChunks, outro];
    const fullTranscript = finalChunks.join('\n\n');
    const cleanedTranscript = cleanTranscript(fullTranscript);

    // Upload assets with concurrency control
    try {
      console.log('Starting asset uploads...');
      
      // Prepare all upload operations
      const uploadOperations = [
        // Upload individual chunks
        ...finalChunks.map(async (chunk, index) => {
          const chunkPath = path.join(sessionDir, `processed-chunk-${index}.txt`);
          await fs.writeFile(chunkPath, chunk);
          return uploadchunksToR2(chunkPath, `chunks/${sessionId}/chunk-${index}.txt`);
        }),
        
        // Upload full transcript
        (async () => {
          const transcriptPath = path.join(sessionDir, 'final-transcript.txt');
          await fs.writeFile(transcriptPath, cleanedTranscript);
          return uploadToR2(transcriptPath, `transcripts/${sessionId}/transcript.txt`);
        })()
      ];

      // Generate metadata in parallel
      const metadataPromises = Promise.all([
        getTitleDescriptionPrompt(cleanedTranscript),
        getSEOKeywordsPrompt(cleanedTranscript),
        getArtworkPrompt(cleanedTranscript)
      ]);

      // Execute all operations with progress
      const [uploadResults, [title, keywords, artworkPrompt]] = await Promise.all([
        Promise.all(uploadOperations),
        metadataPromises
      ]);

      // Extract URLs (last item is transcript)
      const ttsChunkUrls = uploadResults.slice(0, -1);
      const transcriptUrl = uploadResults[uploadResults.length - 1];

      // Prepare response
      const tones = [
        'cheeky', 'reflective', 'high-energy', 
        'dry', 'sincere', 'witty', 'poetic'
      ];
      const tone = tones[Math.floor(Math.random() * tones.length)];

      console.log(`Completed processing in ${((Date.now() - startTime)/1000).toFixed(2)}s`);

      return res.json({
        success: true,
        sessionId,
        metadata: {
          title: formatTitle(title),
          description: title, // Reusing title for description
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
        stats: {
          chunksProcessed: chunkFiles.length,
          transcriptLength: cleanedTranscript.length,
          processingTime: `${((Date.now() - startTime)/1000).toFixed(2)}s`
        }
      });

    } catch (uploadErr) {
      console.error('Upload failed:', uploadErr);
      return res.status(500).json({ 
        error: 'Asset upload failed',
        system: 'R2 storage',
        details: process.env.NODE_ENV === 'development' ? uploadErr.message : undefined
      });
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      session: sessionDir ? path.basename(sessionDir) : 'unknown',
      trace: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;
