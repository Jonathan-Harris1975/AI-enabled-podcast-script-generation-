const memory = new Map();

/**
 * Save data to in-memory store.
 * @param {string} key - Unique key (e.g., 'intro', 'main', 'sessionId-001')
 * @param {*} value - Any serialisable content
 */
export function saveToMemory(key, value) {
  memory.set(key, value);
}

/**
 * Get data from in-memory store.
 * @param {string} key - Key to retrieve
 * @returns {*} Stored value or undefined
 */
export function getFromMemory(key) {
  return memory.get(key);
}

/**
 * Delete a key from memory store.
 * @param {string} key - Key to delete
 */
export function clearFromMemory(key) {
  memory.delete(key);
}

/**
 * Clear all temporary memory — for debugging or reset.
 */
export function clearAllMemory() {
  memory.clear();
}
