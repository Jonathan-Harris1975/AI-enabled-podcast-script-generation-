const cache = {};
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function storeSection(sessionId, type, content) {
  const now = Date.now();
  if (!cache[sessionId]) {
    cache[sessionId] = {};
  }
  cache[sessionId][type] = { content, timestamp: now };
}

function getSection(sessionId, type) {
  cleanup();
  return cache[sessionId]?.[type]?.content || null;
}

function getAllSections(sessionId) {
  cleanup();
  return cache[sessionId]
    ? Object.fromEntries(
        Object.entries(cache[sessionId]).map(([k, v]) => [k, v.content])
      )
    : {};
}

function clearSession(sessionId) {
  delete cache[sessionId];
}

function cleanup() {
  const now = Date.now();
  for (const sessionId of Object.keys(cache)) {
    const allExpired = Object.values(cache[sessionId]).every(
      (entry) => now - entry.timestamp > EXPIRY_MS
    );
    if (allExpired) {
      delete cache[sessionId];
    }
  }
}

export { storeSection, getSection, getAllSections, clearSession };
