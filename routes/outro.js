// routes/outro.js import express from 'express'; import { openai } from '../utils/openai.js'; import { saveToMemory } from '../utils/memoryCache.js'; import getOutroPrompt from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId, hostName } = req.body;

if (!sessionId || !hostName) {
  return res.status(400).json({ error: 'Missing required fields' });
}

const prompt = getOutroPrompt({ hostName });

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  temperature: 0.75,
  messages: [{ role: 'user', content: prompt }]
});

const outroText = completion.choices[0].message.content.trim();
await saveToMemory(sessionId, 'outroText', outroText);

res.json({ sessionId, outroText });

} catch (err) { console.error('❌ Outro route error:', err); res.status(500).json({ error: 'Outro generation failed' }); } });

export default router;

