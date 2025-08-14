import express from 'express';
import { PORT, SESSION_CACHE_PATH } from './config.js';
import fs from 'fs';
import MemoryCache from './utils/memoryCache.js';

const app = express();

// Ensure cache dir exists
fs.mkdirSync(SESSION_CACHE_PATH, { recursive: true, mode: 0o777 });
console.log(`✅ session_cache directory ready at ${SESSION_CACHE_PATH}`);

app.use(express.json());

// Example health check
app.get('/', (req, res) => {
    res.send('Podcast Script Generation Service is running.');
});

// Example cache endpoints
const cache = new MemoryCache();

app.post('/cache', async (req, res) => {
    const { key, value } = req.body;
    await cache.set(key, value);
    res.json({ status: 'ok' });
});

app.get('/cache/:key', async (req, res) => {
    const value = await cache.get(req.params.key);
    res.json({ value });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
