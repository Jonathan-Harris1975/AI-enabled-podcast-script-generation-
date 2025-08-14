// utils/fetchFeeds.js
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
}    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `podcast_${timestamp}.txt`);

    const fullContent = `${introPrompt}\n\n${mainPrompt}\n\n${outroPrompt}`;
    await fs.writeFile(outputFile, fullContent, 'utf8');

    res.json({ success: true, file: outputFile, content: fullContent });
  } catch (err) {
    console.error('Error generating podcast:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
