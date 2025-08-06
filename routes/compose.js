import express from 'express';
import OpenAI from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sections } = req.body;

    let systemPrompt = `
      Combine the following podcast sections into a seamless, engaging script.  
      Maintain a British Gen X tone—witty, confident, and culturally aware.  
      Ensure smooth transitions and consistent voice throughout.  
    `;

    const response = await OpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(sections) }
      ],
    });

    res.json({ script: response.choices[0].message.content });
  } catch (error) {
    console.error('Error composing script:', error);
    res.status(500).json({ error: 'Failed to compose script' });
  }
});

export default router;
