import Parser from 'rss-parser';

const parser = new Parser();
const FEED_URL = 'https://rss-newsletter.onrender.com/feed.xml';

export default async function fetchFeed() {
  try {
    console.log('🌐 Fetching RSS feed:', FEED_URL);
    const feed = await parser.parseURL(FEED_URL);

    if (!feed || !feed.items || feed.items.length === 0) {
      console.warn('⚠️ RSS feed returned no items.');
      return [];
    }

    const articles = feed.items.slice(0, 5).map(item => ({
      title: item.title?.trim() || 'Untitled',
      summary: item.contentSnippet?.trim() || item.content?.trim() || 'No summary available.'
    }));

    console.log(`✅ Parsed ${articles.length} articles.`);
    return articles;
  } catch (err) {
    console.error('❌ Error fetching or parsing RSS feed:', err.message || err);
    return [];
  }
}      console.warn(`Failed to fetch ${url}:`, err.message);
    }
  }

  return articles;
}
