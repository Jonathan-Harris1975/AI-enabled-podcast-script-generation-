import express from 'express';
import fs from 'fs';
import path from 'path';

import { scriptComposer } from '../utils/scriptComposer.js';
import { editAndFormat } from '../utils/editAndFormat.js';
import { chunkText } from '../utils/chunkText.js';
const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) { return res.status(400).json({ error: 'Missing sessionId' }); }

const storageDir = path.resolve('storage', sessionId);
const introPath = path.join(storageDir, 'intro.txt');
const outroPath = path.join(storageDir, 'outro.txt');

if (!fs.existsSync(introPath) || !fs.existsSync(outroPath)) {
  return res.status(400).json({ error: 'Intro or outro not found' });
}

const intro = fs.readFileSync(introPath, 'utf-8');
const outro = fs.readFileSync(outroPath, 'utf-8');

const mainChunks = fs
  .readdirSync(storageDir)
  .filter(f => f.startsWith('tts-chunk-'))
  .sort()
  .map(f => fs.readFileSync(path.join(storageDir, f), 'utf-8'));

const rawScript = [intro, ...mainChunks, outro].join('\n\n');

// 🎯 Run through scriptComposer for editing + chunking
const { finalTranscriptPath, chunkPaths } = await scriptComposer(sessionId, rawScript);

res.json({
  sessionId,
  transcript: finalTranscriptPath,
  ttsChunks: chunkPaths
});

} catch (err) { console.error('❌ Compose error:', err); res.status(500).json({ error: 'Failed to compose final script' }); } });

export default router;

  
