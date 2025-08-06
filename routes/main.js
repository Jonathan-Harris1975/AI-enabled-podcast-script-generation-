import express from 'express';
import Parser from 'rss-parser';
import OpenAI from '../utils/openai.js';

const router = express.Router();
const parser = new Parser();

router.post('/', async (req, res) => {
  try {
    const { feedUrl, maxDays = 7, maxArticles = 40, prompt: externalPrompt } = req.body;

    const feed = await parser.parseURL(feedUrl);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxDays);

    const articles = feed.items
      .filter(item => new Date(item.pubDate) >= cutoffDate)
      .slice(0, maxArticles);

    let systemPrompt = `
      Summarise the following ${articles.length} AI-related articles in a sharp, witty, British Gen X style.  
      Avoid corporate jargon, add cultural references where appropriate.  
    `;

    if (externalPrompt) {
      systemPrompt += `\n\nAdditional context from user: ${externalPrompt}`;
    }

    const response = await OpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(articles) }
      ],
    });

    res.json({ summary: response.choices[0].message.content });
  } catch (error) {
    console.error('Error processing feed:', error);
    res.status(500).json({ error: 'Failed to process feed' });
  }
});

export default router;
