import express from 'express';
import OpenAI from 'openai';
import Parser from 'rss-parser';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const parser = new Parser();

// Helper: fetch latest articles from RSS feed (max 40, last 7 days)
async function fetchLatestArticles(feedUrl) {
  const feed = await parser.parseURL(feedUrl);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return feed.items
    .filter(item => new Date(item.pubDate) >= sevenDaysAgo)
    .slice(0, 40)
    .map(item => `- ${item.title}: ${item.link}`)
    .join('\n');
}

router.post('/', async (req, res) => {
  try {
    const { feedUrl, customPrompt, sessionId } = req.body;

    if (!feedUrl) {
      return res.status(400).json({ error: 'feedUrl is required' });
    }

    const articlesText = await fetchLatestArticles(feedUrl);

    const prompt = customPrompt || `
      Summarize the following AI news articles in a witty and confident British Gen X tone for the podcast 
      "Turing's Torch: AI Weekly" hosted by Jonathan Harris. Be engaging but concise.
      Articles:\n${articlesText}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: prompt }
      ]
    });

    res.json({ text: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating main segment' });
  }
});

export default router;
