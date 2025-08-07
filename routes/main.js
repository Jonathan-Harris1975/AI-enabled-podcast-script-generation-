// routes/main.js
import express from 'express';
import { openai } from '../utils/openai.js';
import fetchFeeds from '../utils/fetchFeeds.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, maxAgeDays = 3, maxFeeds = 40 } = req.body;

    const articles = await fetchFeeds({ maxAgeDays, maxFeeds });

    if (!articles.length) {
      return res.status(500).json({ error: 'No articles found for processing' });
    }

    const summaries = articles.map((a, i) => `${i + 1}. ${a.title} - ${a.summary || a.description || ''}`).join('\n\n');

    const systemPrompt = `
You're Jonathan Harris, host of the podcast "Turing's Torch: AI Weekly".
Summarize the top AI news stories below into a cohesive segment.
Make it informative, a bit witty, and easy to follow.
News:\n${summaries}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt }
      ]
    });

    const message = completion.choices?.[0]?.message?.content?.trim();
    if (!message) throw new Error('No response from OpenAI');

    res.status(200).json({ message });
  } catch (error) {
    console.error('Main generation error:', error.message);
    res.status(500).json({ error: 'Failed to process feed' });
  }
});

export default router;
    const articleText = limitedArticles.map((a, i) => `${i + 1}. ${a.title} - ${a.summary}`).join('\n\n');
    const fullPrompt = `${systemPrompt}\n\nArticles:\n${articleText}\n\n${prompt || ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const message = completion.choices[0].message.content.trim();
    res.status(200).json({ message });
  } catch (error) {
    console.error('Main segment error:', error);
    res.status(500).json({ error: 'Failed to process feed' });
  }
});

export default router;
