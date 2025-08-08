import express from 'express';
import fs from 'fs';
import path from 'path';
import editAndFormat from '../utils/editAndFormat.js';
import splitPlainText from '../utils/splitPlainText.js';

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

    // Read intro & outro as-is (no edit)
    const intro = fs.readFileSync(introPath, 'utf-8').trim().replace(/\n+/g, ' ');
    const outro = fs.readFileSync(outroPath, 'utf-8').trim().replace(/\n+/g, ' ');

    console.log('📁 Reading files from:', storageDir);
    const allFiles = fs.readdirSync(storageDir);
    console.log('📄 Files in session folder:', allFiles);

    // Get raw chunk files
    const rawChunkFiles = allFiles
      .filter(f => f.startsWith('raw-chunk-'))
      .sort((a, b) => {
        const getNum = f => parseInt(f.match(/\d+/)[0], 10);
        return getNum(a) - getNum(b);
      });

    if (rawChunkFiles.length === 0) {
      return res.status(400).json({ error: 'No raw chunk files found' });
    }

    // Read and edit main chunks
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

    res.json({
      sessionId,
      transcriptPath,
      finalChunksPath,
      chunks: finalChunks
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
