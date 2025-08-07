// /routes/main.js ✅ FINAL STRUCTURED VERSION

import express from 'express';
import fetchFeed from '../utils/fetchFeed.js';
import { openai } from '../utils/openai.js';
import { cleanTranscript, chunkText, normaliseKeywords, formatTitle } from '../utils/editAndFormat.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('🧠 Generating main podcast body...');

    const articles = await fetchFeed();
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No articles fetched.');
    }

    const articleSummary = articles.map((a, i) => `${i + 1}. ${a.title} - ${a.summary}`).join('\n');

    const prompt = `
You're the sarcastic British Gen X host of the AI podcast 'Turing's Torch'.

Using the article list below, produce structured plain-text outputs in valid JSON format with the following fields:

{
  "transcript": "",
  "title": "",
  "description": "",
  "keywords": [],
  "artPrompt": ""
}

Rules:
- Transcript must be long-form, flowing, and witty.
- No SSML, no HTML — plain text only.
- Description must be two natural paragraphs.
- Keywords must be lowercase, no duplicates.
- ArtPrompt should describe an AI-themed podcast poster with London imagery.

Articles:
${articleSummary}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('No response from OpenAI.');

    const parsed = JSON.parse(raw);

    const transcript = cleanTranscript(parsed.transcript);
    const ttsChunks = chunkText(transcript);
    const title = formatTitle(parsed.title);
    const description = parsed.description?.trim() || '';
    const keywords = normaliseKeywords(parsed.keywords);
    const artPrompt = parsed.artPrompt?.trim() || '';

    res.status(200).json({
      transcript,
      ttsChunks,
      title,
      description,
      keywords,
      artPrompt
    });

  } catch (err) {
    console.error('❌ Main error:', err.message);
    res.status(500).json({ error: 'Failed to generate podcast body.' });
  }
});

export default router;
