import express from 'express';
import Parser from 'rss-parser';
import { openai } from '../utils/openai.js';

const router = express.Router();
const parser = new Parser();

router.post('/', async (req, res) => {
  try {
    const { feedUrls, daysLimit, prompt } = req.body;

    const articles = [];
    const now = new Date();

    for (const url of feedUrls) {
      const feed = await parser.parseURL(url);
      for (const item of feed.items) {
        const pubDate = new Date(item.pubDate);
        const ageInDays = (now - pubDate) / (1000 * 60 * 60 * 24);
        if (ageInDays <= daysLimit) {
          articles.push({
            title: item.title,
            link: item.link,
            summary: item.contentSnippet
          });
        }
      }
    }

    const limitedArticles = articles.slice(0, 40);

    const systemPrompt = `
You are Jonathan Harris, the host of "Turing's Torch: AI Weekly".
Analyze and summarize the following AI news articles in a Gen X style — intelligent, concise, irreverent when warranted.
Include headlines and brief context.
`;

    const articleText = limitedArticles.map((a, i) => `${i + 1}. ${a.title} - ${a.summary}`).join('\n\n');
    const fullPrompt = `${systemPrompt}\n\nArticles:\n${articleText}\n\n${prompt || ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const message = completion.choices[0].message.content.trim();
    res.status(200).json({ message });
  } catch (error) {
    console.error('Main segment error:', error);
    res.status(500).json({ error: 'Failed to process feed' });
  }
});

export default router;
