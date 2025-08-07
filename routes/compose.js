// ✅ COMPOSE ROUTE — CLEAN, STRUCTURED, R2-UPLOADING

import express from 'express'; import fs from 'fs/promises'; import path from 'path'; import { chunkText, cleanTranscript, formatTitle, normaliseKeywords } from '../utils/editAndFormat.js'; import uploadToR2 from '../utils/uploadToR2.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) throw new Error('No sessionId provided');

const storageDir = path.join('storage', sessionId);

// Read all necessary files
const intro = await fs.readFile(path.join(storageDir, 'intro.txt'), 'utf8');
const main = await fs.readFile(path.join(storageDir, 'main.txt'), 'utf8');
const outroJson = JSON.parse(await fs.readFile(path.join(storageDir, 'outro.json'), 'utf8'));

// Clean and structure content
const transcript = cleanTranscript(`${intro.trim()}

${main.trim()}

${Object.values(outroJson).join('\n\n')}`); const ttsChunks = chunkText(transcript);

const title = formatTitle(await fs.readFile(path.join(storageDir, 'title.txt'), 'utf8'));
const description = (await fs.readFile(path.join(storageDir, 'description.txt'), 'utf8')).trim();
const keywordsRaw = (await fs.readFile(path.join(storageDir, 'keywords.txt'), 'utf8'));
const keywords = normaliseKeywords(keywordsRaw);
const artPrompt = (await fs.readFile(path.join(storageDir, 'artPrompt.txt'), 'utf8')).trim();

const payload = {
  transcript,
  ttsChunks,
  title,
  description,
  keywords,
  artPrompt
};

// Upload full transcript to R2
const transcriptKey = `${sessionId}.txt`;
const url = await uploadToR2(transcriptKey, transcript);

res.status(200).json({ url, ...payload });

} catch (err) { console.error('❌ Compose error:', err.message); res.status(500).json({ error: 'Failed to generate full podcast output.' }); } });

export default router;

