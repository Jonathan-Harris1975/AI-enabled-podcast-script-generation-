// ✅ INTRO ROUTE — STRUCTURED, HOST & EPISODE LOCKED

import express from 'express';
import { openai } from '../utils/openai.js';
import { saveText } from '../utils/tempMemory.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, weather, quote, episode } = req.body;

    if (!sessionId || !weather || !quote || !episode) {
      throw new Error('Missing required fields');
    }

    const prompt = `
You're the sarcastic British Gen X host of the AI podcast 'Turing's Torch'.

Open with a dry, witty welcome from host Jonathan Harris — name must be mentioned naturally.

Include:
- A sarcastic weather summary: "${weather}"
- This Alan Turing quote: "${quote}"
- A cheeky nod to humans vs <say-as interpret-as="characters">A I</say-as>
- Keep it short and punchy, no more than 60 seconds
- DO NOT include the episode number in the script

Return only the intro as a single plain text paragraph.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }]
    });

    const intro = completion.choices[0]?.message?.content?.trim();
    if (!intro) throw new Error('No intro returned from OpenAI');

    await saveText(sessionId, 'intro.txt', intro);

    res.status(200).json({ intro, episode });

  } catch (err) {
    console.error('❌ Intro route error:', err.message);
    res.status(500).json({ error: 'Failed to generate intro.' });
  }
});

export default router;
