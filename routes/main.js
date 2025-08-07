import express from 'express';
import fetchFeed from '../utils/fetchFeed.js';
import getWeatherSummary from '../utils/weather.js';
import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('🌍 Generating podcast output...');

    const articles = await fetchFeed();
    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No valid articles were fetched from feed.');
    }

    const articleSummary = articles.map((article, i) => {
      return `${i + 1}. ${article.title} - ${article.summary}`;
    }).join('\n');

    const weather = await getWeatherSummary();

    const prompt = `
You are the sarcastic British Gen X host of the AI podcast 'Turing's Torch' — your name is Jonathan Harris.
Your task is to generate the following outputs based on the articles and weather:

1. A plain text podcast transcript (no SSML).
2. The same transcript split into 4500-character TTS chunks.
3. A title for the episode.
4. A 2-paragraph episode description.
5. 5–10 SEO keywords.
6. A Midjourney-style artwork prompt for an AI-themed podcast poster referencing London.

Always include clever weather-related commentary specific to London. Be dry, witty, culturally aware, and confident.

Today’s London weather: ${weather}

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
