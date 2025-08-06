import Parser from 'rss-parser';

const parser = new Parser();

/**
 * Fetch and filter RSS feed articles
 * @param {string} url - RSS feed URL
 * @param {number} maxAgeDays - Max article age in days (default 7)
 * @returns {Promise<Array>} - Filtered articles
 */
export default async function fetchFeed(url, maxAgeDays = 7) {
  try {
    const feed = await parser.parseURL(url);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);

    // Filter, deduplicate, and limit
    const articles = feed.items
      .filter(item => {
        if (!item.pubDate) return false;
        const pubDate = new Date(item.pubDate);
        return pubDate >= cutoff;
      })
      .reduce((unique, item) => {
        if (!unique.some(existing => existing.link === item.link)) {
          unique.push({
            title: item.title || '',
            link: item.link || '',
            pubDate: item.pubDate || '',
            contentSnippet: item.contentSnippet || '',
            content: item.content || ''
          });
        }
        return unique;
      }, [])
      .slice(0, 40);

    return articles;
  } catch (err) {
    console.error('Error fetching feed:', err);
    return [];
  }
              }
