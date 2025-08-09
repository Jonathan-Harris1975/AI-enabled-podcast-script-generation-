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
import uploadchunksToR2 from '../utils/uploadchunksToR2.js';

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
    console.log('Env vars for R2:', {
      transcriptBucket: process.env.R2_BUCKET_TRANSCRIPTS,
      transcriptBaseUrl: process.env.R2_PUBLIC_BASE_URL,
      chunksBucket: process.env.R2_BUCKET_CHUNKS,
      chunksBaseUrl: process.env.R2_PUBLIC_BASE_URL_1,
      accessKey: process.env.R2_ACCESS_KEY ? 'set' : 'missing',
      endpoint: process.env.R2_ENDPOINT
    });

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

    // Edit chunks
    const editedMainChunks = await Promise.all(
      rawChunkFiles.map(async f => {
        const filePath = path.join(storageDir, f);
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (!content) throw new Error(`Empty chunk file: ${f}`);
        const edited = await editAndFormat(content);
        return (typeof edited === 'string' ? edited : '').replace(/\n+/g, ' ');
      })
    );

    const transcript = [intro, ...editedMainChunks, outro].join(' ');
    const finalChunks = splitPlainText(transcript, 4500);

    // Save transcript locally
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, transcript);

    // Save chunks JSON locally
    const chunksPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(chunksPath, JSON.stringify(finalChunks, null, 2));

    // Generate title & description
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

    // Upload transcript to R2
    let transcriptUrl = '';
    try {
      console.log('Uploading transcript to R2...');
      transcriptUrl = await uploadToR2(
        transcriptPath,
        `final-text/${sessionId}/final-transcript.txt`
      );
      console.log('Transcript uploaded:', transcriptUrl);
    } catch (err) {
      console.error('Upload to R2 failed:', err);
      return res.status(500).json({ error: 'Upload to R2 failed', details: err.message });
    }

    // Upload chunks to R2
    const chunkUrls = [];
    for (const chunkFile of rawChunkFiles) {
      const localPath = path.join(storageDir, chunkFile);
      const remoteKey = `raw-text/${sessionId}/${chunkFile}`;
      try {
        const url = await uploadChunksToR2(localPath, remoteKey);
        console.log(`Chunk uploaded: ${chunkFile} → ${url}`);
        chunkUrls.push({ filename: chunkFile, url });
      } catch (err) {
        console.error(`Failed to upload chunk ${chunkFile}:`, err);
        // You can choose to continue uploading other chunks or abort here
        return res.status(500).json({ error: `Failed to upload chunk ${chunkFile}`, details: err.message });
      }
    }

    // Save prompts to files locally
    fs.writeFileSync(path.join(storageDir, 'title.txt'), title);
    fs.writeFileSync(path.join(storageDir, 'description.txt'), description);
    fs.writeFileSync(path.join(storageDir, 'seo-keywords.txt'), seoKeywords);
    fs.writeFileSync(path.join(storageDir, 'artwork-prompt.txt'), artworkPromptFinal);

    // Send final JSON response
    res.json({
      sessionId,
      title,
      description,
      seoKeywords,
      artworkPrompt: artworkPromptFinal,
      fullTranscript: transcript,
      chunks: finalChunks,
      transcriptUrl,
      chunkUrls
    });

  } catch (err) {
    console.error('Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final outputs', details: err.message });
  }
});

export default router;
