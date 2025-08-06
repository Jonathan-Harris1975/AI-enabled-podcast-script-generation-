import express from 'express';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getSection } from '../utils/memoryCache.js';
import {
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

  const finalIntro = intro || getSection(sessionId, 'intro');
  const finalMain = main || getSection(sessionId, 'main');
  const finalOutro = outro || getSection(sessionId, 'outro');

  if (!finalIntro || !finalMain || !finalOutro) {
    return res.status(400).json({
      error: 'Missing intro, main, or outro and not found in cache'
    });
  }

  const flatMain = Array.isArray(finalMain)
    ? finalMain.map(item => (typeof item === 'string' ? item : item?.result || '')).map(sanitizeText)
    : [sanitizeText(finalMain)];

  const cleanIntro = sanitizeText(finalIntro);
  const cleanOutro = sanitizeText(finalOutro);
  const combinedText = [cleanIntro, ...flatMain, cleanOutro].join(' ');

  try {
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

    const seoRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      temperature: 0.5,
      messages: [{ role: 'user', content: getSEOKeywordsPrompt(description) }]
    });

    const seo_keywords = seoRes.choices[0].message.content.trim();

    const artRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      temperature: 0.6,
      messages: [{ role: 'user', content: getArtworkPrompt(description) }]
    });

    const artwork_prompt = artRes.choices[0].message.content.trim();

    res.json({
      sessionId,
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
