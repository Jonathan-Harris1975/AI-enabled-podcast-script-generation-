import express from 'express'; import path from 'path'; import fs from 'fs';

import generateOutro from '../utils/generateOutro.js'; import getRandomSponsor from '../utils/getRandomSponsor.js'; import generateCta from '../utils/generateCta.js';

const router = express.Router();

router.post('/', async (req, res) => { try { const { sessionId } = req.body; if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

const sponsor = getRandomSponsor();
const cta = generateCta(sponsor);
const outro = await generateOutro({ sponsor, cta });

const storageDir = path.resolve('storage', sessionId);
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const outroPath = path.join(storageDir, 'outro.txt');
fs.writeFileSync(outroPath, outro);

res.json({ sessionId, outro });

} catch (err) { console.error('❌ Outro generation failed:', err); res.status(500).json({ error: 'Failed to generate outro' }); } });

export default router;

