import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import OpenAI from 'openai';
import splitPlainText from '../utils/splitPlainText.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadChunksToR2 from '../utils/uploadChunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import { getTitleDescriptionPrompt, getSEOKeywordsPrompt, getArtworkPrompt } from '../utils/podcastHelpers.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askOpenAI(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });
  return response.choices[0].message.content;
}

const router = express.Router();

// Optional: simple GET to verify route is live
router.get('/', (req, res) => {
  res.json({ message: 'Compose route is alive' });
});

// Correct POST route at root since mounted at '/compose'
router.post('/', async (req, res) => {
  try {
    const { sessionId, rawText } = req.body;
    if (!sessionId || !rawText) {
      return res.status(400).json({ error: 'Missing sessionId or rawText' });
    }

    // Prepare local storage folder
    const storageDir = path.resolve('/mnt/data', sessionId);
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

    // 1. Edit & clean transcript
    const editedText = await editAndFormat(rawText);
    if (!editedText || editedText.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript is empty after formatting' });
    }

    // 2. Save full transcript locally
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, editedText, 'utf-8');

    // 3. Split transcript into chunks
    const chunks = splitPlainText(editedText, 4500);

    // 4. Upload full transcript to R2
    const transcriptKey = `final-text/${sessionId}/final-transcript.txt`;
    const transcriptUrl = await uploadToR2(transcriptPath, transcriptKey);

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

    // 6. Generate title & description
    const titleDescPrompt = getTitleDescriptionPrompt(editedText);
    const titleDescResponse = await askOpenAI(titleDescPrompt);

    let title, description;
    try {
      ({ title, description } = JSON.parse(titleDescResponse));
    } catch (err) {
      return res.status(500).json({ error: 'Failed to parse AI title/description JSON' });
    }
    if (!title || !description) {
      return res.status(500).json({ error: 'AI generated title or description missing' });
    }

    // 7. Generate SEO keywords
    const seoPrompt = getSEOKeywordsPrompt(description);
    const seoKeywordsRaw = await askOpenAI(seoPrompt);
    const seoKeywords = seoKeywordsRaw.trim();

    // 8. Generate artwork prompt
    const artworkPrompt = getArtworkPrompt(description);
    const artworkDescription = (await askOpenAI(artworkPrompt)).trim();

    // 9. Respond
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
        artworkPrompt: artworkDescription,
      },
    });
  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
