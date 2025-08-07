// utils/fetchFeeds.js
import Parser from 'rss-parser';
const parser = new Parser();

export default async function fetchFeeds(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);
    return feed.items.slice(0, 5).map(item => ({
      title: item.title || 'Untitled',
      summary: item.contentSnippet?.slice(0, 400) || 'No summary available.'
    }));
  } catch (err) {
    console.error('❌ Failed to fetch or parse RSS feed:', err.message);
    return [];
  }
}
