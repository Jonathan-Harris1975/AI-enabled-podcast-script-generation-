// routes/main.js
import express from 'express';
import fetchFeed from '../utils/fetchFeed.js';
import { openai } from '../utils/openai.js';
import { saveToMemory } from '../utils/memoryCache.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('🧠 Generating podcast main content...');
    const { sessionId } = req.body;
    if (!sessionId) throw new Error('Missing sessionId');

    const articles = await fetchFeed();
    if (!articles.length) throw new Error('No valid articles fetched');

    const articleSummary = articles.map((a, i) => `${i + 1}. ${a.title} - ${a.summary}`).join('\n');

    const prompt = `
You're the sarcastic British Gen X host of the AI podcast 'Turing's Torch'.

Using the articles below, generate a witty and intelligent long-form monologue as if delivering the main segment of an AI podcast.

Articles:
${articleSummary}

No SSML or HTML, plain text only.
Don't mention article count or numbers.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }]
    });

    const main = completion.choices[0]?.message?.content?.trim();
    if (!main) throw new Error('Main content generation failed');

    saveToMemory(sessionId, 'main', main);
    res.status(200).json({ main });

  } catch (err) {
    console.error('❌ Main route error:', err.message);
    res.status(500).json({ error: 'Podcast main generation failed.' });
  }
});

export default router;
