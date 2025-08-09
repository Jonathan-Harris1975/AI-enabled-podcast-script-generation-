import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import splitPlainText from '../utils/splitPlainText.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadChunksToR2 from '../utils/uploadChunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import { getTitleDescriptionPrompt, getSEOKeywordsPrompt, getArtworkPrompt } from '../utils/podcastHelpers.js';
import runAI from '../utils/runAI.js'; // your AI call util

const router = express.Router();

router.post('/compose', async (req, res) => {
  try {
    const { sessionId, rawText } = req.body;
    if (!sessionId || !rawText) {
      return res.status(400).json({ error: 'Missing sessionId or rawText' });
    }

    // Prepare storage directory
    const storageDir = path.resolve('/mnt/data', sessionId);
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

    // 1. Edit & format raw text → full transcript
    const editedText = await editAndFormat(rawText);
    if (!editedText || editedText.trim() === '') {
      return res.status(400).json({ error: 'Transcript is empty after formatting' });
    }

    // 2. Save full transcript locally
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, editedText, 'utf-8');

    // 3. Split into chunks of max 4500 chars
    const chunks = splitPlainText(editedText, 4500);

    // 4. Upload full transcript to R2 (final-text bucket)
    const transcriptKey = `final-text/${sessionId}/final-transcript.txt`;
    const transcriptUrl = await uploadToR2(transcriptPath, transcriptKey);

    // 5. Upload chunks to R2 (raw-text bucket)
    const chunkUrls = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tempFilePath = path.join(os.tmpdir(), `upload-chunk-${sessionId}-${i + 1}.txt`);
      fs.writeFileSync(tempFilePath, chunk, 'utf-8');
      const key = `raw-text/${sessionId}/chunk-${i + 1}.txt`;
      const url = await uploadChunksToR2(tempFilePath, key);
      fs.unlinkSync(tempFilePath);
      chunkUrls.push(url);
    }

    // 6. Generate AI metadata prompts — AFTER transcript is created/uploaded
    const titleDescPrompt = getTitleDescriptionPrompt(editedText);
    const titleDescJson = await runAI(titleDescPrompt);
    const { title, description } = JSON.parse(titleDescJson);

    const seoPrompt = getSEOKeywordsPrompt(description);
    const seoKeywords = await runAI(seoPrompt);

    const artworkPrompt = getArtworkPrompt(description);
    const artworkDescription = await runAI(artworkPrompt);

    // 7. Send all results
    res.json({
      sessionId,
      transcriptUrl,
      chunkUrls,
      chunks,
      fullTranscript: editedText,
      podcast: {
        title,
        description,
        seoKeywords,
        artworkPrompt: artworkDescription
      }
    });
  } catch (err) {
    console.error('Compose route error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
