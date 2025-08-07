
import express from 'express';
import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { intro, main, outro } = req.body;

    const fullScript = `
${intro}

---

${main}

---

${outro}
`;

    const systemPrompt = `
You are a podcast editor for "Turing's Torch: AI Weekly".
Merge the intro, main segment, and outro into a clean, broadcast-ready script in Gen X tone.
Ensure smooth transitions and a consistent voice throughout.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: `${systemPrompt}\n\n${fullScript}` }]
    });

    const message = completion.choices[0].message.content.trim();
    res.status(200).json({ message });
  } catch (error) {
    console.error('Compose error:', error);
    res.status(500).json({ error: 'Failed to compose full script' });
  }
});

export default router;
