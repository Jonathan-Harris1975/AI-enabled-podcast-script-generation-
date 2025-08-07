import express from 'express';
import { openai } from '../utils/openai.js';
import getRandomBook from '../utils/books.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { prompt } = req.body;
    const book = getRandomBook();

    const systemPrompt = `
You're Jonathan Harris, closing out the "Turing's Torch: AI Weekly" podcast.
Sign off in Gen X style with gratitude, humor, and wit.
Mention today's episode was sponsored by the book "${book}".
End with a signature farewell and reminder to tune in next week.
`;

    const fullPrompt = `${systemPrompt}\n\n${prompt || ''}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const message = completion.choices[0].message.content.trim();
    res.status(200).json({ message });
  } catch (error) {
    console.error('Outro generation error:', error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;      messages: [
        { role: 'system', content: systemPrompt }
      ]
    });

    res.json({ outro: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating outro:', error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
