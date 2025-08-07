// utils/editAndFormat.js

/**
 * Clean up transcript text:
 * - Normalise spacing
 * - Trim rogue newlines
 * - Remove redundant filler
 */
export function cleanTranscript(text = '') {
  return text
    .replace(/\s{2,}/g, ' ')            // Collapse multiple spaces
    .replace(/\n{2,}/g, '\n')           // Collapse multiple line breaks
    .replace(/^\s+|\s+$/g, '')          // Trim start/end whitespace
    .replace(/(So,|Anyway,|Well,)\s+/gi, '') // Kill some filler phrases
    .trim();
}

/**
 * Ensure title case, trimmed and punctuation-safe.
 */
export function formatTitle(title = '') {
  return title
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(^\w|\s\w)/g, match => match.toUpperCase())
    .replace(/[.!?]$/, ''); // Remove trailing punctuation
}

/**
 * Lowercase, deduplicate and trim keyword list.
 */
export function normaliseKeywords(keywords = []) {
  if (!Array.isArray(keywords)) return [];
  const seen = new Set();
  return keywords
    .map(k => k.toLowerCase().trim())
    .filter(k => !!k && !seen.has(k) && seen.add(k));
}
