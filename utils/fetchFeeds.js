import Parser from 'rss-parser';
const parser = new Parser();

export default async function fetchFeeds(feedUrl) {
  try {
    const feed = await parser.parseURL(feedUrl);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const filteredItems = feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate || item.isoDate || '');
        return pubDate >= sevenDaysAgo && pubDate <= now;
      })
      .slice(0, 40)
      .map(item => ({
        title: item.title || 'Untitled',
        summary: item.contentSnippet?.slice(0, 400) || 'No summary available.'
      }));

    return filteredItems;
  } catch (err) {
    console.error('❌ Failed to fetch or parse RSS feed:', err.message);
    return [];
  }
}
