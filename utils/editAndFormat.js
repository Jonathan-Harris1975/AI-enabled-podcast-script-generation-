// ✅ UTILS: CLEANING + FORMATTING FOR PLAIN TEXT PODCAST OUTPUTS

// Break long text into chunks (≤ 4500 characters)
export function chunkText(text, maxLength = 4500) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end > text.length) {
      end = text.length;
    } else {
      const lastBreak = text.lastIndexOf('.', end);
      if (lastBreak > start) end = lastBreak + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}

// Clean transcript (remove excess spacing, tidy quotes)
export function cleanTranscript(text) {
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\n{2,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Capitalise each word for title formatting
export function formatTitle(title) {
  return title.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1));
}

// Clean and dedupe SEO keywords
export function normaliseKeywords(raw) {
  return [...new Set(
    raw
      .split(/[;,\n]/)
      .map(k => k.trim().toLowerCase())
      .filter(Boolean)
  )];
}
