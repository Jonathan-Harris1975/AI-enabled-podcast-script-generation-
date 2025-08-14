import fs from 'fs/promises';
import path from 'path';
import { SESSION_CACHE_PATH } from '../config.js';

export default class MemoryCache {
    constructor() {
        this.cache = {};
    }

    async set(key, value) {
        this.cache[key] = value;
        const filePath = path.join(SESSION_CACHE_PATH, `${key}.json`);
        try {
            await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
        } catch (err) {
            console.error(`Failed to write cache file for key: ${key}`, err);
        }
    }

    async get(key) {
        if (this.cache[key]) {
            return this.cache[key];
        }
        const filePath = path.join(SESSION_CACHE_PATH, `${key}.json`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const parsed = JSON.parse(data);
            this.cache[key] = parsed;
            return parsed;
        } catch {
            return null;
        }
    }

    async clear(key) {
        delete this.cache[key];
        const filePath = path.join(SESSION_CACHE_PATH, `${key}.json`);
        try {
            await fs.unlink(filePath);
        } catch {
            // ignore if doesn't exist
        }
    }

    async clearAll() {
        this.cache = {};
        try {
            const files = await fs.readdir(SESSION_CACHE_PATH);
            for (const file of files) {
                await fs.unlink(path.join(SESSION_CACHE_PATH, file));
            }
        } catch (err) {
            console.error('Failed to clear all cache files:', err);
        }
    }
}
