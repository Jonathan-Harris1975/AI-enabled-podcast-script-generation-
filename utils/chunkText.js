export function chunkText(text, maxLength = 4500) {
  const chunks = [];
  let current = '';

  const sentences = text.split(/(?<=[.?!])\s+/);

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = '';
    }
    current += sentence + ' ';
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
