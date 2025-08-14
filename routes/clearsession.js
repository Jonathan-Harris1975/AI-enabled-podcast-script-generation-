import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import { SESSION_CACHE_PATH } from '../config.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { sessionid } = req.body;

    if (!sessionid) {
        return res.status(400).json({ error: 'sessionid is required' });
    }

    try {
        const files = await fs.readdir(SESSION_CACHE_PATH);

        const matchingFiles = files.filter(file =>
            file.startsWith(`${sessionid}_intro`) ||
            file.startsWith(`${sessionid}_main`) ||
            file.startsWith(`${sessionid}_outro`)
        );

        await Promise.all(
            matchingFiles.map(file =>
                fs.unlink(path.join(SESSION_CACHE_PATH, file))
            )
        );

        res.json({
            status: 'session cleared',
            deleted: matchingFiles
        });
    } catch (err) {
        console.error(`Error clearing session ${sessionid}:`, err);
        res.status(500).json({ error: 'Failed to clear session' });
    }
});

export default router;
