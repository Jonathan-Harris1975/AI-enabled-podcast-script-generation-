// routes/compose.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import editAndFormat from '../utils/editAndFormat.js';
import splitPlainText from '../utils/splitPlainText.js';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt
} from '../utils/podcastHelpers.js';
import uploadToR2 from '../utils/uploadToR2.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Clean + format transcript
    const cleanedTranscript = await editAndFormat(transcript);

    // Save full transcript locally
    const sessionId = `TT-${new Date().toISOString().split('T')[0]}`;
    const transcriptsDir = path.join(process.cwd(), 'sessions', sessionId);
    fs.mkdirSync(transcriptsDir, { recursive: true });
    const transcriptPath = path.join(transcriptsDir, 'transcript.txt');
    fs.writeFileSync(transcriptPath, cleanedTranscript, 'utf-8');

    // Upload full transcript to R2
    const transcriptUrl = await uploadToR2(
      `transcripts/${sessionId}/transcript.txt`,
      cleanedTranscript
    );

    // Split into chunks of ~4500 chars
    const chunks = splitPlainText(cleanedTranscript, 4500);

    // Upload chunks to R2 and collect URLs
    const chunkUrls = await Promise.all(
      chunks.map((chunk, idx) =>
        uploadToR2(
          `raw-text/${sessionId}/chunk-${idx + 1}.txt`,
          chunk
        )
      )
    );

    // Build single combined prompt for title + description
    const tdPrompt = getTitleDescriptionPrompt(cleanedTranscript);
    const { title, description } = await editAndFormat(tdPrompt, true);

    // Get SEO keywords
    const seoPrompt = getSEOKeywordsPrompt(description);
    const seoKeywords = await editAndFormat(seoPrompt);

    // Get artwork prompt
    const artworkPrompt = getArtworkPrompt(description);

    // Final API response
    res.json({
      title,
      description,
      seoKeywords,
      artworkPrompt,
      fullTranscript: transcriptUrl,
      chunks: chunkUrls
    });
  } catch (err) {
    console.error('Compose route error:', err);
    res.status(500).json({ error: 'Failed to process transcript' });
  }
});

export default router;
