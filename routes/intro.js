import express from 'express';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { introPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/intro', async (req, res) => {
  const { sessionId, prompt } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let promptContent;

    if (prompt) {
      // Use provided custom prompt
      promptContent = prompt;
    } else {
      // Use default Gen X style intro
      promptContent = introPrompt;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a sarcastic Gen X podcast intro writer.' },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'intro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Intro error:', error.message);
    res.status(500).json({ error: 'Intro generation failed', details: error.message });
  }
});

export default router;      } catch (err) {
        console.warn('Weather fetch failed in /intro:', err.message);
      }
    }

    const quote = getRandomQuote();
    if (quote) {
      promptContent += `\n\nQuote of the day: "${quote}" — Alan Turing`;
    }

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: 'You are a witty British podcast host.' },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'intro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Intro error:', error.message);
    res.status(500).json({ error: 'Intro generation failed', details: error.message });
  }
});

export default router;
