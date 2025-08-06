import express from 'express';
import memoryCache from '../utils/memoryCache.js';
import books from '../utils/books.json' assert { type: 'json' };
import { callOpenAI } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, prompt } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    // Pick random sponsor book
    const sponsorBook = books[Math.floor(Math.random() * books.length)];

    const systemPrompt = prompt
      ? `${prompt}\n\nAlso sign off with Jonathan Harris, mention "Turing’s Torch: AI Weekly", and include this sponsor: ${sponsorBook.title} by ${sponsorBook.author}.`
      : `Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly" with host Jonathan Harris. 
         Use a British Gen X tone. Mention that new episodes drop every Friday. 
         Sign off with my name and promote this sponsor book: "${sponsorBook.title}" by ${sponsorBook.author}.`;

    const outroContent = await callOpenAI(systemPrompt);

    // Cache
    memoryCache.storeSection(sessionId, 'outro', outroContent);

    res.json({ sessionId, outro: outroContent, sponsor: sponsorBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;      temperature: 0.75,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'outro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Outro error:', error.message);
    res.status(500).json({ error: 'Outro generation failed', details: error.message });
  }
});

export default router;
