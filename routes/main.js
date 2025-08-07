import express from 'express';
import { openai } from '../utils/openai.js';
import fetchFeeds from '../utils/fetchFeeds.js';
import getWeatherSummary from '../utils/weather.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;

    const articles = await fetchFeeds();
    const weather = getWeatherSummary();

    const articleSummary = articles.map((article, i) =>
      `${i + 1}. ${article.title} - ${article.summary}`).join('\n');

    const systemPrompt = `
You're the AI host of the 'Turing's Torch: AI Weekly' podcast.
Today’s tech weather: ${weather}
Here are this week's top AI stories:\n${articleSummary}
Weave them into a cohesive and insightful narrative.
`;

    const fullPrompt = `${systemPrompt}\n\n${prompt || ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const message = completion.choices[0].message.content.trim();
    res.status(200).json({ message });

  } catch (error) {
    console.error('Main generation error:', error);
    res.status(500).json({ error: 'Failed to process feed' });
  }
});

export default router;
