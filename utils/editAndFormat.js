// utils/editAndFormat.js

export function cleanTranscript(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\.\s+\./g, '.')
    .replace(/["“”]/g, '')
    .trim();
}

export function formatTitle(title = '') {
  return title
    .replace(/\s+/g, ' ')
    .replace(/^"|"$/g, '')
    .replace(/\.\.+$/, '.')
    .trim();
}

export function normaliseKeywords(keywords = []) {
  const seen = new Set();
  return keywords
    .map(k => k.toLowerCase().trim())
    .filter(k => {
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}
