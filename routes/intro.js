import fs from 'fs/promises';
import express from 'express';
import path from 'path';
import { SESSION_CACHE_PATH } from '../config.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { sessionid, date } = req.body;

    if (!sessionid || !date) {
        return res.status(400).json({ error: 'sessionid and date are required' });
    }

    const filePath = path.join(SESSION_CACHE_PATH, `${sessionid}_intro.json`);
    try {
        const content = {
            date,
            generated: new Date().toISOString()
        };
        await fs.writeFile(filePath, JSON.stringify(content, null, 2), 'utf8');
        res.json({ status: 'intro saved', path: filePath });
    } catch (err) {
        console.error('Error saving intro data:', err);
        res.status(500).json({ error: 'Failed to save intro' });
    }
});

export default router;
