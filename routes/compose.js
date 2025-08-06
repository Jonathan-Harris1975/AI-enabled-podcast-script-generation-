import express from 'express';
import memoryCache from '../utils/memoryCache.js';
import { callOpenAI } from '../utils/openai.js';
import generateIntro from './intro.js';
import generateMain from './main.js';
import generateOutro from './outro.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    let intro = memoryCache.getSection(sessionId, 'intro');
    let main = memoryCache.getSection(sessionId, 'main');
    let outro = memoryCache.getSection(sessionId, 'outro');

    // Auto-generate if missing
    if (!intro) {
      intro = (await generateIntro(req, res, true)) || '';
    }
    if (!main) {
      main = (await generateMain(req, res, true)) || '';
    }
    if (!outro) {
      outro = (await generateOutro(req, res, true)) || '';
    }

    const editorPrompt = `Combine the following sections into a polished podcast script. Keep flow and tone consistent.
Intro:\n${intro}\n\nMain:\n${main}\n\nOutro:\n${outro}`;

    const finalScript = await callOpenAI(editorPrompt);

    res.json({
      sessionId,
      intro,
      main,
      outro,
      finalScript
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compose final script' });
  }
});

export default router;
  try {
    const scriptResp = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.65,
      messages: [
        {
          role: 'system',
          content:
            editorPrompt ||
            'You are a sharp, witty British Gen X podcast editor. Stitch together the provided intro, main segments, and outro into one cohesive podcast script. Maintain consistent tone and pacing, using dry humour and cultural flair throughout. Ensure transitions between sections are natural and polished. Output a single plain text block — no formatting, no markdown, just clean, broadcast-ready text..'
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
