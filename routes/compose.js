import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import editAndFormat from '../utils/editAndFormat.js';
import splitPlainText from '../utils/splitPlainText.js';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt
} from '../utils/podcastHelpers.js';

import uploadToR2 from '../utils/uploadToR2.js'; // For transcripts
import uploadChunksToR2 from '../utils/uploadChunksToR2.js'; // For chunks

const router = express.Router();

async function runPrompt(prompt) {
  const result = await editAndFormat(prompt);
  if (typeof result === 'string') {
    return result.trim();
  }
  return '';
}

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

    const intro = fs.readFileSync(introPath, 'utf-8').trim().replace(/\n+/g, ' ');
    const outro = fs.readFileSync(outroPath, 'utf-8').trim().replace(/\n+/g, ' ');

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

    // Edit raw chunks
    const editedMainChunks = await Promise.all(
      rawChunkFiles.map(async f => {
        const filePath = path.join(storageDir, f);
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (!content) throw new Error(`Empty chunk file: ${f}`);
        const edited = await editAndFormat(content);
        return (typeof edited === 'string' ? edited : '').replace(/\n+/g, ' ');
      })
    );

    // Compose final transcript text cleanly
    const transcript = [intro, ...editedMainChunks, outro].join(' ');

    // Split final transcript into 4500 char chunks
    const finalChunks = splitPlainText(transcript, 4500);

    // Save final transcript and chunks locally
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, transcript);

    const chunksPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(chunksPath, JSON.stringify(finalChunks, null, 2));

    // Generate title & description from full transcript
    const titleDescriptionRaw = await runPrompt(getTitleDescriptionPrompt(transcript));
    let title = '';
    let description = '';
    try {
      const parsed = JSON.parse(titleDescriptionRaw);
      title = parsed.title || '';
      description = parsed.description || '';
    } catch {
      console.warn('⚠ Could not parse title/description JSON, raw output:', titleDescriptionRaw);
    }

    const seoKeywords = await runPrompt(getSEOKeywordsPrompt(description));
    const artworkPromptFinal = await runPrompt(getArtworkPrompt(description));

    // Upload full transcript
    let transcriptUrl = '';
    try {
      transcriptUrl = await uploadToR2(
        transcriptPath,
        `final-text/${sessionId}/final-transcript.txt`
      );
    } catch (uploadErr) {
      console.error('❌ Upload transcript to R2 failed:', uploadErr);
      return res.status(500).json({ error: 'Upload transcript to R2 failed', details: uploadErr.message });
    }

    // Upload chunks and collect URLs
    let chunkUrls = [];
    try {
      for (let i = 0; i < finalChunks.length; i++) {
        const chunk = finalChunks[i];
        const key = `final-text/${sessionId}/chunk-${i + 1}.txt`;
        const tempFilePath = path.join(os.tmpdir(), `upload-chunk-${sessionId}-${i + 1}.txt`);

        // Write chunk to temp file
        fs.writeFileSync(tempFilePath, chunk, 'utf-8');

        // Upload the temp file
        await uploadChunksToR2(tempFilePath, key);

        // Delete temp file after upload
        fs.unlinkSync(tempFilePath);

        chunkUrls.push(`${process.env.R2_PUBLIC_BASE_URL_1}/${process.env.R2_BUCKET_CHUNKS}/${key}`);
      }
    } catch (uploadErr) {
      console.error('❌ Upload chunks to R2 failed:', uploadErr);
      return res.status(500).json({ error: 'Upload chunks to R2 failed', details: uploadErr.message });
    }

    // Save metadata locally
    fs.writeFileSync(path.join(storageDir, 'title.txt'), title);
    fs.writeFileSync(path.join(storageDir, 'description.txt'), description);
    fs.writeFileSync(path.join(storageDir, 'seo-keywords.txt'), seoKeywords);
    fs.writeFileSync(path.join(storageDir, 'artwork-prompt.txt'), artworkPromptFinal);

    // Respond with all data including chunk URLs
    res.json({
      sessionId,
      title,
      description,
      seoKeywords,
      artworkPrompt: artworkPromptFinal,
      fullTranscript: transcript,
      chunks: finalChunks,
      chunkUrls,
      transcriptUrl
    });
  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({
      error: 'Failed to compose final outputs',
      details: err.message || String(err)
    });
  }
});

export default router;
