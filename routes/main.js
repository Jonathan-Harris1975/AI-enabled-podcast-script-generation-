// ✅ /main ROUTE — CLEAN, STRUCTURED OUTPUT PER FIELD

import express from 'express'; import fetchFeed from '../utils/fetchFeed.js'; import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => { try { console.log('🧠 Generating structured podcast main content...');

const articles = await fetchFeed();
if (!Array.isArray(articles) || articles.length === 0) {
  throw new Error('No valid articles were fetched from feed.');
}

const storySummary = articles.map((article, i) => {
  return `${i + 1}. ${article.title}\n\n${article.summary}\n`;
}).join('\n');

const prompt = `

You're the sarcastic British Gen X host of the AI podcast 'Turing's Torch'.

Using the article list below, produce structured plain-text outputs in valid JSON format with the following fields:

{ "transcript": "", "title": "", "description": "", "keywords": [], "artPrompt": "" }

Rules:

Transcript must be long-form, flowing, and witty.

No SSML, no HTML — plain text only.

Description must be two natural paragraphs.

Keywords must be lowercase, no duplicates.

ArtPrompt should describe an AI-themed podcast poster with London imagery.


Articles: ${storySummary} `;

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.75,
  messages: [{ role: 'user', content: prompt }],
});

const response = completion.choices[0]?.message?.content?.trim();
if (!response) throw new Error('OpenAI returned empty response.');

const json = JSON.parse(response);
res.status(200).json(json);

} catch (err) { console.error('❌ Main route error:', err.message); res.status(500).json({ error: 'Podcast generation failed.' }); } });

export default router;


Articles:
${articleSummary}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = completion.choices[0]?.message?.content?.trim();
    if (!response) throw new Error('OpenAI returned empty response.');

    res.status(200).json({ result: response });
  } catch (err) {
    console.error('❌ Main route error:', err.message);
    res.status(500).json({ error: 'Podcast generation failed.' });
  }
});

export default router;
