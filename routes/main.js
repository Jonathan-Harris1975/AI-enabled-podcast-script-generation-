import express from 'express';
import Parser from 'rss-parser';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { mainPrompt } from '../utils/promptTemplates.js';

const router = express.Router();
const parser = new Parser();

router.post('/main', async (req, res) => {
  const { sessionId, rssUrl, prompt } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let promptContent;

    if (prompt) {
      // Use the provided external prompt
      promptContent = prompt;
    } else if (rssUrl) {
      // Fetch RSS feed and build Gen X prompt
      const feed = await parser.parseURL(rssUrl);
      const newsSummaries = feed.items
        .map(item => `${item.title}: ${item.contentSnippet || ''}`)
        .join('\n');
      promptContent = `${mainPrompt}\n\nNews Items:\n${newsSummaries}`;
    } else {
      return res.status(400).json({ error: 'Either rssUrl or prompt is required' });
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a sarcastic Gen X tech podcast writer.' },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'main', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Main error:', error.message);
    res.status(500).json({ error: 'Main generation failed', details: error.message });
  }
});

export default router;
