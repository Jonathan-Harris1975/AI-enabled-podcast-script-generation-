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

    if (!fs.existsSync(introPath) || !fs.existsSync(outroPath)) {
      return res.status(400).json({ error: 'Intro or outro not found' });
    }

    // Read intro & outro (no editAndFormat applied)
    const intro = fs.readFileSync(introPath, 'utf-8').trim().replace(/\n+/g, ' ');
    const outro = fs.readFileSync(outroPath, 'utf-8').trim().replace(/\n+/g, ' ');

    console.log('📁 Reading files from:', storageDir);
    const allFiles = fs.readdirSync(storageDir);
    console.log('📄 Files in session folder:', allFiles);

    // Get raw chunk files (sort numerically)
    const rawChunkFiles = allFiles
      .filter(f => f.startsWith('raw-chunk-'))
      .sort((a, b) => {
        const getNum = f => parseInt(f.match(/\d+/)[0], 10);
        return getNum(a) - getNum(b);
      });

    if (rawChunkFiles.length === 0) {
      return res.status(400).json({ error: 'No raw chunk files found' });
    }

    // Read and edit ONLY main chunks
    const editedMainChunks = await Promise.all(
      rawChunkFiles.map(async f => {
        const filePath = path.join(storageDir, f);
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (!content) throw new Error(`Empty chunk file: ${f}`);
        const edited = await editAndFormat(content);
        return (typeof edited === 'string' ? edited : '').replace(/\n+/g, ' ');
      })
    );

    // Merge all into transcript
    const transcript = [intro, ...editedMainChunks, outro].join(' ');

    // Split into ≤ 4500 character chunks
    const finalChunks = splitPlainText(transcript, 4500);

    // Save transcript
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, transcript);

    // Save chunks JSON
    const finalChunksPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(finalChunksPath, JSON.stringify(finalChunks, null, 2));

    // Generate prompts using podcastHelpers
    const titleDescriptionPrompt = getTitleDescriptionPrompt(transcript);
    const seoPrompt = getSEOKeywordsPrompt('{{DESCRIPTION_PLACEHOLDER}}');
    const artworkPrompt = getArtworkPrompt('{{DESCRIPTION_PLACEHOLDER}}');

    // Save prompts to files
    fs.writeFileSync(path.join(storageDir, 'title-description-prompt.txt'), titleDescriptionPrompt);
    fs.writeFileSync(path.join(storageDir, 'seo-prompt.txt'), seoPrompt);
    fs.writeFileSync(path.join(storageDir, 'artwork-prompt.txt'), artworkPrompt);

    res.json({
      sessionId,
      transcriptPath,
      finalChunksPath,
      chunks: finalChunks,
      prompts: {
        titleDescription: titleDescriptionPrompt,
        seo: seoPrompt,
        artwork: artworkPrompt
      }
    });

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({
      error: 'Failed to compose final chunks',
      details: err.message
    });
  }
});

export default router;
