import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import splitPlainText from '../utils/splitPlainText.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadChunksToR2 from '../utils/uploadChunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import { getTitleDescriptionPrompt, getSEOKeywordsPrompt, getArtworkPrompt } from '../utils/podcastHelpers.js';
import runAI from '../utils/runAI.js'; // your LLM call utility

const router = express.Router();

router.post('/compose', async (req, res) => {
  try {
    const { sessionId, rawText } = req.body;
    if (!sessionId || !rawText) {
      return res.status(400).json({ error: 'Missing sessionId or rawText' });
    }

    // Setup storage
    const storageDir = path.resolve('/mnt/data', sessionId);
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

    // 1. Clean & format raw text → edited transcript
    const editedText = await editAndFormat(rawText);
    if (!editedText || editedText.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is empty after formatting' });
    }
    console.log(`Edited transcript length: ${editedText.length}`);

    // 2. Save transcript locally
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, editedText, 'utf-8');

    // 3. Split transcript into chunks (max 4500 chars)
    const chunks = splitPlainText(editedText, 4500);

    // 4. Upload full transcript to R2
    const transcriptKey = `final-text/${sessionId}/final-transcript.txt`;
    const transcriptUrl = await uploadToR2(transcriptPath, transcriptKey);
    console.log(`Uploaded transcript URL: ${transcriptUrl}`);

    // 5. Upload chunks to R2
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

    // 6. Generate title & description (JSON expected)
    const titleDescPrompt = getTitleDescriptionPrompt(editedText);
    const titleDescResponse = await runAI(titleDescPrompt);
    console.log('Title/Description AI response:', titleDescResponse);

    let title, description;
    try {
      ({ title, description } = JSON.parse(titleDescResponse));
    } catch (err) {
      console.error('Failed to parse title/description JSON:', err);
      return res.status(500).json({ error: 'Failed to generate podcast title and description' });
    }

    if (!title || !description) {
      return res.status(500).json({ error: 'Generated title or description is missing' });
    }

    // 7. Generate SEO keywords (comma-separated list)
    const seoPrompt = getSEOKeywordsPrompt(description);
    const seoKeywords = await runAI(seoPrompt);
    console.log('SEO keywords AI response:', seoKeywords);

    // 8. Generate artwork prompt
    const artworkPrompt = getArtworkPrompt(description);
    const artworkDescription = await runAI(artworkPrompt);
    console.log('Artwork prompt AI response:', artworkDescription);

    // 9. Respond with all data
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
        artworkPrompt: artworkDescription.trim()
      }
    });
  } catch (error) {
    console.error('Compose route error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
