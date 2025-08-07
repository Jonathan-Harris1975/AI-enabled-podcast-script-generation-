// routes/outro.js

import express from 'express'; import fs from 'fs'; import path from 'path'; import { openai } from '../utils/openai.js'; import getRandomSponsor from '../utils/getRandomSponsor.js'; import generateCTA from '../utils/generateCTA.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) { return res.status(400).json({ error: 'Missing sessionId' }); }

const sponsor = getRandomSponsor();
const cta = generateCTA(sponsor);

const prompt = `

You're the dry-witted solo host of the podcast "Turing's Torch: AI Weekly". You're British, Gen X, no fluff, and you're closing out the episode. You're signing off solo — no team, no "we". Say "I" or "me". Never refer to Jonathan Harris in the third person — it's you. The book is your ebook, you wrote it. Avoid referring to yourself in third person. End the episode naturally, with a strong but conversational CTA that encourages listeners to visit the main site for your ebook collection and to sign up for your newsletter.

The featured ebook this week is called "${sponsor.title}" — the URL is ${sponsor.url}.

Keep it tight, witty, and human. No bullet points, no markdown, no SSML. Here's the call to action for the book: ${cta}

Now generate a closing script in that tone.`.trim();

const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.8,
});

const outro = completion.choices[0].message.content.trim();

const storageDir = path.resolve('storage', sessionId);
if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

const outroPath = path.join(storageDir, 'outro.txt');
fs.writeFileSync(outroPath, outro);

res.json({ outro });

} catch (err) { console.error('❌ Outro generation failed:', err); res.status(500).json({ error: 'Failed to generate outro' }); } });

export default router;

