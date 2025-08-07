// utils/memoryCache.js
const memoryStore = {};

export function saveToMemory(sessionId, key, value) {
  if (!memoryStore[sessionId]) {
    memoryStore[sessionId] = {};
  }
  memoryStore[sessionId][key] = value;
}

export function getFromMemory(sessionId, key) {
  return memoryStore[sessionId]?.[key];
}

export function clearMemory(sessionId) {
  if (memoryStore[sessionId]) {
    delete memoryStore[sessionId];
  }
}
