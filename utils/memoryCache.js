// utils/memoryCache.js

const memoryStore = new Map();

/**
 * Save a value under a session and key
 * @param {string} sessionId
 * @param {string} key
 * @param {*} value
 */
export function saveToMemory(sessionId, key, value) {
  if (!memoryStore.has(sessionId)) {
    memoryStore.set(sessionId, {});
  }
  memoryStore.get(sessionId)[key] = value;
}

/**
 * Retrieve a value from memory by session and key
 * @param {string} sessionId
 * @param {string} key
 * @returns {*}
 */
export function getFromMemory(sessionId, key) {
  return memoryStore.get(sessionId)?.[key];
}

/**
 * Flush memory for a session
 * @param {string} sessionId
 */
export function flushSession(sessionId) {
  memoryStore.delete(sessionId);
}

/**
 * Dump entire memory (for debugging)
 * @returns {Map}
 */
export function dumpMemory() {
  return memoryStore;
}
