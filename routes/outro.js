import express from 'express';
import { openai } from '../utils/openai.js';
import { formatSponsor } from '../utils/formatSponsor.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sponsor } = req.body;

    const sponsorText = formatSponsor(sponsor);

    const prompt = `
You're the sarcastic British Gen X host of 'Turing’s Torch'.
Write a structured podcast outro as JSON with the following fields:

{
  "signOff": "",
  "sponsorBlurb": "",
  "reminder": "",
  "finalMessage": "",
  "farewell": ""
}

Tone: dry wit, clever, intelligent.  
Reference the sponsor here: ${sponsorText}  
Each field should be no more than 2–3 sentences. Use natural language, no SSML.
Return the result as valid JSON only.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    const response = completion.choices[0]?.message?.content?.trim();
    const outro = JSON.parse(response);

    res.status(200).json(outro);
  } catch (err) {
    console.error('❌ Outro route error:', err.message);
    res.status(500).json({ error: 'Failed to generate outro.' });
  }
});

export default router;
