// utils/chunkText.js

export function chunkText(text = '', maxLength = 4500) {
  const chunks = [];
  let current = '';

  for (const sentence of text.split(/(?<=[.?!])\s+/)) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
