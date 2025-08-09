import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import OpenAI from 'openai';
import splitPlainText from '../utils/splitPlainText.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadChunksToR2 from '../utils/uploadChunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';
import {
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt,
  getIntroPrompt,
  getMainPrompt,
  getOutroPromptFull,
} from '../utils/podcastHelpers.js';
import { getRandomTone } from '../utils/toneSetter.js';  // Correct named import

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

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const storageDir = path.resolve('/mnt/data', sessionId);
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');

    if (!fs.existsSync(transcriptPath)) {
      return res.status(404).json({ error: 'Transcript file not found' });
    }

    // Read raw transcript from disk
    const rawTranscript = fs.readFileSync(transcriptPath, 'utf-8');

    // Pick a random tone for the whole episode
    const tone = getRandomTone();

    // Read intro and outro that were already created (no generation)
    const introPath = path.join(storageDir, 'intro.txt');
    const outroPath = path.join(storageDir, 'outro.txt');

    if (!fs.existsSync(introPath) || !fs.existsSync(outroPath)) {
      return res.status(404).json({ error: 'Intro or outro file not found' });
    }

    const introText = fs.readFileSync(introPath, 'utf-8').trim();
    const outroText = fs.readFileSync(outroPath, 'utf-8').trim();

    // Generate main prompt and get main text (to be edited)
    const mainPrompt = getMainPrompt([rawTranscript], tone);
    let mainText = await askOpenAI(mainPrompt);

    // Edit and format main text only
    mainText = await editAndFormat(mainText);
    if (!mainText || !mainText.trim()) {
      return res.status(400).json({ error: 'Main script is empty after formatting' });
    }

    // Combine all parts into final transcript
    const fullTranscript = [introText, mainText, outroText].join('\n\n');

    // Save full transcript locally (overwrite or new file)
    const finalTranscriptPath = path.join(storageDir, 'final-full-transcript.txt');
    fs.writeFileSync(finalTranscriptPath, fullTranscript, 'utf-8');

    // Split full transcript into chunks (4500 chars max)
    const chunks = splitPlainText(fullTranscript, 4500);

    // Upload full transcript to R2
    const transcriptKey = `final-text/${sessionId}/final-full-transcript.txt`;
    const transcriptUrl = await uploadToR2(finalTranscriptPath, transcriptKey);

    // Upload chunks to R2
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

    // Generate title & description from full transcript
    const titleDescPrompt = getTitleDescriptionPrompt(fullTranscript);
    const titleDescResponse = await askOpenAI(titleDescPrompt);
    let title, description;
    try {
      ({ title, description } = JSON.parse(titleDescResponse));
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI title/description JSON' });
    }
    if (!title || !description) {
      return res.status(500).json({ error: 'AI generated title or description missing' });
    }

    // Generate SEO keywords
    const seoPrompt = getSEOKeywordsPrompt(description);
    const seoKeywordsRaw = await askOpenAI(seoPrompt);
    const seoKeywords = seoKeywordsRaw.trim();

    // Generate artwork prompt
    const artworkPrompt = getArtworkPrompt(description);
    const artworkDescription = (await askOpenAI(artworkPrompt)).trim();

    // Respond with everything
    res.json({
      sessionId,
      transcriptUrl,
      chunkUrls,
      chunks,
      fullTranscript,
      podcast: {
        title,
        description,
        seoKeywords,
        artworkPrompt: artworkDescription,
      },
      tone,
    });
  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
