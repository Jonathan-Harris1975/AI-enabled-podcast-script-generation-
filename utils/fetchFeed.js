import Parser from 'rss-parser';

const parser = new Parser();
const FEED_URL = 'https://rss-newsletter.onrender.com/feed.xml';

export default async function fetchFeed() {
  try {
    const feed = await parser.parseURL(FEED_URL);
    if (!feed || !feed.items || feed.items.length === 0) return [];

    return feed.items.map(item => ({
      title: item.title?.trim() || 'Untitled',
      summary: item.content?.trim() || item.contentSnippet?.trim() || 'No summary available.'
    }));
  } catch (err) {
    console.error('❌ RSS fetch error:', err.message);
    return [];
  }
}
