import express from 'express';
import { openai } from '../services/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { getSection } from '../utils/memoryCache.js';

const router = express.Router();

function chunkText(text, size = 4500) {
  const chunks = [];
  while (text.length > size) {
    let idx = text.lastIndexOf(' ', size);
    if (idx < 0) idx = size;
    chunks.push(text.slice(0, idx));
    text = text.slice(idx).trim();
  }
  if (text) chunks.push(text);
  return chunks;
}

router.post('/compose', async (req, res) => {
  const { sessionId, intro, main, outro, editorPrompt, date } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  // Pull missing parts from cache
  const finalIntro = intro || getSection(sessionId, 'intro');
  const finalMain = main || getSection(sessionId, 'main');
  const finalOutro = outro || getSection(sessionId, 'outro');

  if (!finalIntro || !finalMain || !finalOutro) {
    return res.status(400).json({ error: 'Missing intro, main, or outro and not found in cache' });
  }

  // Flatten main: support array of strings or { result }
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
    // Step 1: Create final script using editorPrompt
    const scriptMessages = [
      {
        role: 'system',
        content:
          editorPrompt ||
          'You are a podcast editor. Rewrite the following transcript into a smooth, engaging, cohesive podcast script with witty British flair.'
      },
      {
        role: 'user',
        content: combinedText
      }
    ];

    const scriptResp = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.65,
      messages: scriptMessages
    });

    const transcript = sanitizeText(scriptResp.choices[0].message.content);
    const tts = chunkText(transcript);

    // Step 2: Title + Description (Basic task → gpt-3.5-turbo)
    const tdPrompt = `Based on the following AI news summaries, generate two things:
1. A short, punchy episode title (max 10 words) that captures the dominant theme or most intriguing idea. No hashtags, no colons, no episode numbers. Capitalise major words.
2. A brief podcast episode description (max 300 characters). Write it in a clear, human tone. Summarise the items collectively — don’t list them individually. Avoid phrases like "this episode" or "we cover." Just write it like a Spotify show blurb.

News Items: ${transcript}

Respond in the following JSON format only:
{ "title": "Your punchy episode title here", "description": "Your engaging episode summary here" }`;

    const tdRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: tdPrompt }],
      temperature: 0.7
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

    // Step 3: SEO Keywords (Basic task → gpt-3.5-turbo)
    const seoPrompt = `Extract 8–14 SEO-optimised keywords and phrases based on the following episode descriptions. Focus on short, high-impact terms relevant to AI, tech, business, ethics, innovation, or current trends. 
Prioritise phrases that people might realistically search for on Spotify, Apple Podcasts, Google, or YouTube. Include a mix of:
- 1–2-word keywords (e.g. "AI tools", "machine learning")
- 2–4-word search-friendly phrases (e.g. "AI in healthcare", "AI legal tech")
Avoid hashtags, duplicate terms, or clickbait. Format as a comma-separated list only — no explanations, no quotes, no headings.

Episode description: ${description}`;

    const seoRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: seoPrompt }],
      temperature: 0.5
    });

    const seo_keywords = seoRes.choices[0].message.content.trim();

    // Step 4: Artwork Prompt (Basic task → gpt-3.5-turbo)
    const artPrompt = `Turn the following podcast episode summary into a vivid, artistic image prompt under 100 characters. Avoid any text, branding, or logos. Focus on abstract or conceptual visuals.

Episode Summary: ${description}`;

    const artRes = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL_META || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: artPrompt }],
      temperature: 0.6
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

export default router;  }
});

module.exports = router;
