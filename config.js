import fs from 'fs';

const DEFAULT_CACHE_PATH = '/mnt/data/session_cache';
let CACHE_PATH = DEFAULT_CACHE_PATH;

// Check if /mnt/data is writable, else fallback to /tmp
try {
    fs.mkdirSync(DEFAULT_CACHE_PATH, { recursive: true, mode: 0o777 });
} catch (err) {
    console.warn('⚠️ /mnt/data not writable, falling back to /tmp/session_cache');
    CACHE_PATH = '/tmp/session_cache';
    fs.mkdirSync(CACHE_PATH, { recursive: true, mode: 0o777 });
}

export const PORT = process.env.PORT || 3000;
export const SESSION_CACHE_PATH = CACHE_PATH;
