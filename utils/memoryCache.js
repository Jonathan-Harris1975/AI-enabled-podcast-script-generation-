import fs from 'fs';
import path from 'path';

const cacheDir = '/mnt/data/session_cache';

// Ensure the cache directory exists with full permissions
fs.mkdirSync(cacheDir, { recursive: true, mode: 0o777 });

/**
 * Simple in-memory cache with optional file storage
 */
export default class MemoryCache {
    constructor() {
        this.cache = {};
    }

    set(key, value) {
        this.cache[key] = value;
        const filePath = path.join(cacheDir, `${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
    }

    get(key) {
        if (this.cache[key]) {
            return this.cache[key];
        }
        const filePath = path.join(cacheDir, `${key}.json`);
        if (fs.existsSync(filePath)) {
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
                this.cache[key] = parsed;
                return parsed;
            } catch (err) {
                console.error(`Failed to read cache file for key: ${key}`, err);
                return null;
            }
        }
        return null;
    }

    clear(key) {
        delete this.cache[key];
        const filePath = path.join(cacheDir, `${key}.json`);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error(`Failed to delete cache file for key: ${key}`, err);
            }
        }
    }

    clearAll() {
        this.cache = {};
        fs.readdirSync(cacheDir).forEach(file => {
            const filePath = path.join(cacheDir, file);
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error(`Failed to delete cache file: ${filePath}`, err);
            }
        });
    }
        }
