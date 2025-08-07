import express from 'express'; import path from 'path'; import fs from 'fs'; import { openai } from '../utils/openai.js'; import getSponsor from '../utils/getSponsor.js'; import generateOutroPrompt from '../utils/generateOutro.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) { return res.status(400).json({ error: 'Missing sessionId' }); }

const storageDir = path.resolve('storage', sessionId);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const sponsor = getSponsor();
const outroPrompt = generateOutroPrompt(sponsor);

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.75,
  messages: [{ role: 'user', content: outroPrompt }]
});

let outro = completion.choices[0].message.content.trim();

// Flatten to plain text (no paragraphs)
outro = outro.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

// Save outro to file
const outroPath = path.join(storageDir, 'outro.txt');
fs.writeFileSync(outroPath, outro, 'utf-8');

console.log('✅ Outro saved to', outroPath);
res.json({ sessionId, outro });

} catch (err) { console.error('❌ Outro generation failed:', err); res.status(500).json({ error: 'Failed to generate outro' }); } });

export default router;

