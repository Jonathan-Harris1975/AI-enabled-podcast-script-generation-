// utils/splitPlainText.js
export default function splitPlainText(text, maxLength = 4800) {
  const chunks = [];
  let current = '';
  const sentences = text.split(/(?<=[.?!])\s+/);

  for (const sentence of sentences) {
    if ((current + sentence).length <= maxLength) {
      current += sentence + ' ';
    } else {
      chunks.push(current.trim());
      current = sentence + ' ';
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
