import express from 'express';
import fs from 'fs';
import path from 'path';
import editAndFormat from '../utils/editAndFormat.js';
import composeScript from '../utils/scriptComposer.js';
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

    const intro = fs.readFileSync(introPath, 'utf-8').trim().replace(/\n+/g, ' ');
    const outro = fs.readFileSync(outroPath, 'utf-8').trim().replace(/\n+/g, ' ');

    console.log('📁 Reading files from:', storageDir);
    const allFiles = fs.readdirSync(storageDir);
    console.log('📄 Files in session folder:', allFiles);

    const rawChunkFiles = allFiles
      .filter(f => f.startsWith('raw-chunk-'))
      .sort((a, b) => {
        const getNum = f => parseInt(f.match(/\d+/)[0], 10);
        return getNum(a) - getNum(b);
      });

    if (rawChunkFiles.length === 0) {
      return res.status(400).json({ error: 'No raw chunk files found' });
    }

    const rawChunks = rawChunkFiles.map(f => {
      const filePath = path.join(storageDir, f);
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      if (!content) throw new Error(`Empty chunk file: ${f}`);
      return content;
    });

    const formattedChunks = await Promise.all(
      rawChunks.map(async chunk => {
        const edited = await editAndFormat(chunk);
        return typeof edited === 'string' ? edited.replace(/\n+/g, ' ') : '';
      })
    );

    const tones = ['cheeky', 'reflective', 'high-energy', 'dry as hell', 'overly sincere', 'witty', 'oddly poetic'];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    console.log(`🎙️ Selected tone: ${tone}`);

    const transcript = await composeScript(intro, formattedChunks, outro);
    const transcriptPath = path.join(storageDir, 'transcript.txt');
    fs.writeFileSync(transcriptPath, transcript);

    // Split into chunks ≤ 4500 characters, plain text (no line breaks)
    const cleanTranscript = transcript.replace(/\n+/g, ' ');
    const finalChunks = splitPlainText(cleanTranscript, 4500);

    const chunksPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(chunksPath, JSON.stringify(finalChunks, null, 2));

    res.json({
      sessionId,
      tone,
      transcriptPath,
      chunksPath,
      chunkCount: finalChunks.length,
      chunks: finalChunks
    });

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final chunks', details: err.message });
  }
});

export default router;
