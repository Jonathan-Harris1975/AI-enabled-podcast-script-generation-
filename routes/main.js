import express from 'express';
import Parser from 'rss-parser';
import OpenAI from 'openai';

const router = express.Router();
const parser = new Parser();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
  try {
    const { feedUrl, prompt: userPrompt, maxAgeDays = 7, maxArticles = 40 } = req.body;

    const feed = await parser.parseURL(feedUrl);

    // Filter by age
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const recentItems = feed.items
      .filter(item => new Date(item.pubDate).getTime() > cutoff)
      .slice(0, maxArticles);

    const articlesText = recentItems
      .map(item => `Title: ${item.title}\nLink: ${item.link}`)
      .join('\n\n');

    const basePrompt = `
Summarise and comment on the following AI news articles for "Turing’s Torch: AI Weekly" hosted by Jonathan Harris.
Make it insightful, witty, and British Gen X in tone.
Articles:
${articlesText}
    `;

    const messages = [
      { role: 'system', content: basePrompt },
      ...(userPrompt ? [{ role: 'user', content: userPrompt }] : [])
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.75
    });

    res.json({ main: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate main section' });
  }
});

export default router;
