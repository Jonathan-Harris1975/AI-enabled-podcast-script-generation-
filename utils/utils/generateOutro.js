// utils/generateOutro.js (or wherever you're generating outro content)

import fs from 'fs'; import path from 'path'; import { openai } from '../utils/openai.js'; import getRandomSponsor from '../utils/getRandomSponsor.js';

const generateOutro = async (sessionId) => { const { title: sponsor, url } = getRandomSponsor();

const prompt = ` You're the British Gen X host of "Turing's Torch: AI Weekly" — dry, witty, intelligent, and speaking directly to your audience.

Wrap up this week's episode with a relaxed, unscripted vibe. Then, recommend one of your own ebooks, titled: "${sponsor}" — include the direct URL: ${url}. Make it sound like a casual suggestion from a mate, not a sponsor plug.

Encourage listeners to check out the full ebook collection and sign up for your newsletter at https://www.jonathan-harris.online.

Make it plain text (no SSML), first person (you're Jonathan Harris), under 4500 characters, and natural — no robotic phrasing. Inject dry humour, British phrasing, and clever sarcasm where it fits.

End on a smart, memorable closing line. `.trim();

const completion = await openai.chat.completions.create({ model: 'gpt-4', temperature: 0.8, messages: [{ role: 'user', content: prompt }] });

const outroText = completion.choices[0].message.content.trim();

// 🔐 Save to storage const storagePath = path.resolve('storage', sessionId); if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

fs.writeFileSync(path.join(storagePath, 'outro.txt'), outroText);

return outroText; };

export default generateOutro;

