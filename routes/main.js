import express from 'express'; import { openai } from '../utils/openai.js'; import fetchFeeds from '../utils/fetchFeeds.js'; import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { rssFeedUrl, sessionId } = req.body;

if (!rssFeedUrl || !sessionId) {
  return res.status(400).json({ error: 'Missing required fields' });
}

console.log('🧠 Generating podcast main content...');

const articles = await fetchFeeds(rssFeedUrl);

const formattedArticles = articles
  .map((article, i) => `${i + 1}. ${article.title} - ${article.summary}`)
  .join('\n');

const systemPrompt = `Rewrite each AI news summary as a standalone podcast segment. Tone: intelligent, sarcastic British Gen X. Dry wit, cultural commentary, and confident delivery. For each article: - Start with a dry joke or clever one-liner - Explain the topic clearly\n\n${formattedArticles}`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.75,
  messages: [{ role: 'user', content: systemPrompt }]
});

const response = completion.choices[0].message.content.trim();
const chunks = response
  .split(/\n\n+/)
  .map((chunk) => chunk.trim())
  .filter(Boolean);

await saveToMemory(sessionId, 'main-tts', chunks);

res.json({ chunks });

} catch (error) { console.error('❌ Main route error:', error.message); res.status(500).json({ error: 'Podcast generation failed' }); } });

export default router;

                                      
