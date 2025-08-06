import express from 'express';
import Parser from 'rss-parser';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const router = express.Router();
const parser = new Parser();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// RSS feed sources
const FEEDS = [
  'https://www.theverge.com/rss/index.xml',
  'https://www.wired.com/feed/rss',
  'https://www.technologyreview.com/topnews.rss',
  // add more feeds here if needed
];

const MAX_ARTICLES = 40;
const MAX_AGE_DAYS = 7;

// Helper: Filter articles by age
function isRecent(pubDate) {
  const now = new Date();
  const published = new Date(pubDate);
  const ageDays = (now - published) / (1000 * 60 * 60 * 24);
  return ageDays <= MAX_AGE_DAYS;
}

router.post('/', async (req, res) => {
  const sessionId = req.body.sessionId || uuidv4();
  const externalPrompt = req.body.prompt;

  try {
    let allArticles = [];

    // Fetch articles from all feeds
    for (const feedUrl of FEEDS) {
      try {
        const feed = await parser.parseURL(feedUrl);
        const recentArticles = feed.items.filter(item => isRecent(item.pubDate));
        allArticles = allArticles.concat(recentArticles);
      } catch (err) {
        console.error(`Error fetching feed ${feedUrl}:`, err);
      }
    }

    // Limit to MAX_ARTICLES
    allArticles = allArticles.slice(0, MAX_ARTICLES);

    if (allArticles.length === 0) {
      return res.status(200).json({
        sessionId,
        content: 'No recent articles found to generate content.'
      });
    }

    // Combine into one string
    const summaries = allArticles
      .map(item => `Title: ${item.title}\nSummary: ${item.contentSnippet || item.content || ''}`)
      .join('\n\n');

    // Build prompt
    const basePrompt = `
You are creating the main segment for the podcast "Turing’s Torch: AI Weekly" hosted by Jonathan Harris.
Summarise and weave together the following ${allArticles.length} recent tech/AI articles into a cohesive,
witty, and intelligent Gen X–toned narrative. Keep the style confident, dry-humoured, and culturally savvy.
Ensure transitions between topics are smooth and the segment feels like a single monologue.
Here are the articles:\n\n${summaries}
`;

    const finalPrompt = externalPrompt
      ? `${externalPrompt}\n\n${summaries}`
      : basePrompt;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert podcast script writer.' },
        { role: 'user', content: finalPrompt }
      ],
      temperature: 0.7
    });

    const content = completion.choices[0]?.message?.content || 'No content generated.';

    res.status(200).json({
      sessionId,
      content
    });

  } catch (error) {
    console.error('Error in compose route:', error);
    res.status(500).json({
      sessionId,
      error: error.message
    });
  }
});

export default router;
