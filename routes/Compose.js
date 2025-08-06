import express from 'express';
import { openai } from '../services/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getSection } from '../utils/memoryCache.js';
import {
  splitTextForTTS,
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt
} from '../utils/podcastHelpers.js';

const router = express.Router();

router.post('/compose', async (req, res) => {
  const { sessionId, intro, main, outro, editorPrompt } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // Pull missing sections from cache
  const finalIntro = intro || getSection(sessionId, 'intro');
  const finalMain = main || getSection(sessionId, 'main');
  const finalOutro = outro || getSection(sessionId, 'outro');

  if (!finalIntro || !finalMain || !finalOutro) {
    return res.status(400).json({
      error: 'Missing intro, main, or outro and not found in cache'
    });
  }

  // Flatten main array into plain text list
  const flatMain = Array.isArray(finalMain)
    ? finalMain
        .map(item => (typeof item === 'string' ? item : item?.result || ''))
        .map(sanitizeText)
        .filter(Boolean)
    : [sanitizeText(finalMain)];

  const cleanIntro = sanitizeText(finalIntro);
  const cleanOutro = sanitizeText(finalOutro);
  const combinedText = [cleanIntro, ...flatMain, cleanOutro].join(' ');

  try {
    // Step 1: Create final script
    const scriptResp = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.65,
      messages: [
        {
          role: 'system',
          content:
            editorPrompt ||
            'You are a podcast editor. Rewrite the following transcript into a smooth, engaging, cohesive podcast script with witty British flair.'
        },
        { role: 'user', content: combinedText }
      ]
    });

    const transcript = sanitizeText(scriptResp.choices[0].message.content);
    const tts = splitTextForTTS(transcript);

    // Step 2: Title + Description
    const tdRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [{ role: 'user', content: getTitleDescriptionPrompt(transcript) }]
    });

    let title = '';
    let description = '';
    try {
      const parsed = JSON.parse(tdRes.choices[0].message.content.trim());
      title = parsed.title;
      description = parsed.description;
    } catch (err) {
      console.warn('Failed to parse title/description JSON:', err.message);
    }

    // Step 3: SEO Keywords
    const seoRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      temperature: 0.5,
      messages: [{ role: 'user', content: getSEOKeywordsPrompt(description) }]
    });

    const seo_keywords = seoRes.choices[0].message.content.trim();

    // Step 4: Artwork Prompt
    const artRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      temperature: 0.6,
      messages: [{ role: 'user', content: getArtworkPrompt(description) }]
    });

    const artwork_prompt = artRes.choices[0].message.content.trim();

    res.json({
      sessionId,
      tts,
      transcript,
      title,
      description,
      seo_keywords,
      artwork_prompt
    });
  } catch (err) {
    console.error('Compose+Generate error:', err.message);
    res.status(502).json({ error: 'Compose+Generate failed', details: err.message });
  }
});

export default router;
