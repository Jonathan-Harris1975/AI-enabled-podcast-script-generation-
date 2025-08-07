// utils/fetchFeeds.js
import Parser from 'rss-parser';

const parser = new Parser();

// List of AI-related RSS feeds
const feedUrls = [
  'https://www.technologyreview.com/feed/',
  'https://spectrum.ieee.org/rss/fulltext',
  'https://www.aitrends.com/feed/',
  'https://feeds.arstechnica.com/arstechnica/technology-lab',
  'https://venturebeat.com/category/ai/feed/'
];

export default async function fetchFeeds({ maxAgeDays = 3, maxFeeds = 40 } = {}) {
  const articles = [];

  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);

      feed.items.forEach((item) => {
        if (articles.length >= maxFeeds) return;

        const pubDate = new Date(item.pubDate);
        const ageDays = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);

        if (ageDays <= maxAgeDays) {
          articles.push({
            title: item.title,
            summary: item.contentSnippet || item.summary || '',
            link: item.link
          });
        }
      });
    } catch (err) {
      console.warn(`Failed to fetch ${url}:`, err.message);
    }
  }

  return articles;
}
