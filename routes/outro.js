// routes/compose.js
import express from 'express';
import { cleanTranscript, formatTitle, normaliseKeywords } from '../utils/editAndFormat.js';
import { chunkText } from '../utils/chunkText.js';
import uploadToR2 from '../utils/uploadToR2.js';
import { getFromMemory, saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, title, description, keywords, artPrompt } = req.body;
    if (!sessionId || !title || !description || !keywords || !artPrompt) {
      throw new Error('Missing required compose fields');
    }

    const intro = getFromMemory(sessionId, 'intro');
    const main = getFromMemory(sessionId, 'main');

    if (!intro || !main) throw new Error('Intro or main missing from memory');

    const transcript = cleanTranscript(`${intro}\n\n${main}`);
    const ttsChunks = chunkText(transcript);

    saveToMemory(sessionId, 'transcript', transcript);
    saveToMemory(sessionId, 'ttsChunks', ttsChunks);
    saveToMemory(sessionId, 'title', title);
    saveToMemory(sessionId, 'description', description);
    saveToMemory(sessionId, 'keywords', normaliseKeywords(keywords));
    saveToMemory(sessionId, 'artPrompt', artPrompt);

    const transcriptKey = `${sessionId}.txt`;
    const url = await uploadToR2(transcriptKey, transcript);

    res.status(200).json({
      url,
      transcript,
      ttsChunks,
      title: formatTitle(title),
      description,
      keywords: normaliseKeywords(keywords),
      artPrompt
    });

  } catch (err) {
    console.error('❌ Compose error:', err.message);
    res.status(500).json({ error: 'Failed to generate full podcast output.' });
  }
});

export default router;
