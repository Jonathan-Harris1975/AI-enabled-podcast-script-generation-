// utils/memoryCache.js

const cache = {};

/**
 * Save content to memory cache under a session ID and file key.
 * @param {string} sessionId
 * @param {string} key - e.g. 'intro', 'main', 'outro'
 * @param {string} content
 */
export function saveToMemory(sessionId, key, content) {
  if (!cache[sessionId]) {
    cache[sessionId] = {};
  }
  cache[sessionId][key] = content;
}

/**
 * Retrieve cached content by session ID and key.
 * @param {string} sessionId
 * @param {string} key
 * @returns {string | undefined}
 */
export function getFromMemory(sessionId, key) {
  return cache[sessionId]?.[key];
}

/**
 * Get all content for a session (e.g. intro + main + outro).
 * @param {string} sessionId
 * @returns {object} session content
 */
export function getSessionMemory(sessionId) {
  return cache[sessionId] || {};
}

/**
 * Clear a session from cache.
 * @param {string} sessionId
 */
export function clearMemory(sessionId) {
  delete cache[sessionId];
}      delete cache[sessionId];
    }
  }
}

export { storeSection, getSection, getAllSections, clearSession };
