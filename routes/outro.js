// routes/outro.js import express from 'express'; import fs from 'fs'; import path from 'path';
import express from 'express';
import { openai } from '../utils/openai.js'; import getSponsor from '../utils/getSponsor.js'; import generateCta from '../utils/generateCta.js'; import editAndFormat from '../utils/editAndFormat.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) { return res.status(400).json({ error: 'Missing sessionId' }); }

const sponsor = await getSponsor();
const cta = await generateCta();

const prompt = `You're the British Gen X host of Turing's Torch: AI Weekly. You're signing off the show with a witty, reflective outro. Reference this ebook: "${sponsor.title}" (link: ${sponsor.url}). Speak in the first person, no third-person references. Make the book sound like one *you* wrote, and keep the tone dry, confident, and informal. Close with this CTA: ${cta}. Output should be plain text with no paragraph breaks.`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.75,
  messages: [{ role: 'user', content: prompt }]
});

const outro = editAndFormat(completion.choices[0].message.content.trim()).replace(/\n+/g, ' ');

const storageDir = path.resolve('storage', sessionId);
fs.mkdirSync(storageDir, { recursive: true });
fs.writeFileSync(path.join(storageDir, 'outro.txt'), outro);

res.json({ outro });

} catch (err) { console.error('❌ Outro generation failed:', err); res.status(500).json({ error: 'Failed to generate outro' }); } });

export default router;

