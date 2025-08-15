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
} from '../utils/podcastHelpers.js';
import { getRandomTone } from '../utils/toneSetter.js';

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

// Episode counter file
const EPISODE_FILE = path.resolve('/mnt/data', 'episodes.json');

function getNextEpisodeNumber() {
  let episodes = { lastEpisode: 0 };
  if (fs.existsSync(EPISODE_FILE)) {
    try {
      episodes = JSON.parse(fs.readFileSync(EPISODE_FILE, 'utf-8'));
    } catch {
      episodes = { lastEpisode: 0 };
    }
  }
  episodes.lastEpisode += 1;
  fs.writeFileSync(EPISODE_FILE, JSON.stringify(episodes), 'utf-8');
  return String(episodes.lastEpisode).padStart(2, '0');
}

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
    const mainPath = path.join(storageDir, 'main.txt');

    // Find chunk files for main transcript
    let filesInDir = [];
    if (fs.existsSync(storageDir)) {
      filesInDir = fs.readdirSync(storageDir);
    }
    // Find all chunk-*.txt files and sort numerically
    const mainChunkFiles = filesInDir
      .filter(f => /^chunk-\d+\.txt$/.test(f))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/^chunk-(\d+)\.txt$/)[1], 10);
        const bNum = parseInt(b.match(/^chunk-(\d+)\.txt$/)[1], 10);
        return aNum - bNum;
      })
      .map(f => path.join(storageDir, f));

    // DEBUG: print chunk files found
    console.log('Main chunk files found:', mainChunkFiles);

    // Check existence of intro, main (chunks or main.txt), and outro
    const introExists = fs.existsSync(introPath);
    const outroExists = fs.existsSync(outroPath);
    const mainExists = (mainChunkFiles.length > 0) || fs.existsSync(mainPath);

    if (!introExists || !mainExists || !outroExists) {
      return res.status(404).json({
        error: 'One or more transcript parts not found (intro, main, outro)',
        details: { introExists, mainExists, outroExists, storageDir, mainChunkFiles }
      });
    }

    // Read intro and outro
    const introText = fs.readFileSync(introPath, 'utf-8').trim();
    const outroText = fs.readFileSync(outroPath, 'utf-8').trim();

    // Read and combine main transcript (chunks if present, else main.txt)
    let mainText;
    if (mainChunkFiles.length > 0) {
      mainText = mainChunkFiles
        .map(f => fs.readFileSync(f, 'utf-8').trim())
        .filter(Boolean)
        .join('\n\n');
      console.log(`Combined ${mainChunkFiles.length} chunk files for main transcript.`);
    } else {
      mainText = fs.readFileSync(mainPath, 'utf-8').trim();
      console.log('Using main.txt for main transcript.');
    }

    mainText = await editAndFormat(mainText);
    if (!mainText || !mainText.trim()) {
      return res.status(400).json({ error: 'Main script is empty after formatting' });
    }

    const fullTranscript = [introText, mainText, outroText].join('\n\n');
    const finalTranscriptPath = path.join(storageDir, 'final-full-transcript.txt');
    fs.writeFileSync(finalTranscriptPath, fullTranscript, 'utf-8');

    const chunks = splitPlainText(fullTranscript, 4500);

    // Upload transcript to R2 but use custom URL format
    const transcriptKey = `${sessionId}.txt`;
    await uploadToR2(finalTranscriptPath, transcriptKey);
    const transcriptUrl = `https://transcripts.jonathan-harris.online/${sessionId}.txt`;

    const chunkUrls = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const tempFilePath = path.join(os.tmpdir(), `upload-chunk-${sessionId}-${i + 1}.txt`);
      fs.writeFileSync(tempFilePath, chunk, 'utf-8');

      const key = `${sessionId}/chunk-${i + 1}.txt`;
      const url = await uploadChunksToR2(tempFilePath, key);

      fs.unlinkSync(tempFilePath);
      chunkUrls.push(url);
    }

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

    // Add episode number
    const episodeNumber = getNextEpisodeNumber();
    title = `Episode ${episodeNumber} - ${title}`;

    const seoPrompt = getSEOKeywordsPrompt(description);
    const seoKeywordsRaw = await askOpenAI(seoPrompt);
    const seoKeywords = seoKeywordsRaw.trim();

    const artworkPrompt = getArtworkPrompt(description);
    const artworkDescription = (await askOpenAI(artworkPrompt)).trim();

    const tone = getRandomTone();

    res.json({
      sessionId,
      episodeNumber,
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
      debug: {
        introPath,
        mainChunkFiles,
        usedMainPath: mainChunkFiles.length > 0 ? mainChunkFiles : mainPath,
        outroPath,
      }
    });
  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
