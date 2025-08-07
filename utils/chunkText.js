export default function chunkText(text, maxLength = 4500) {
  const chunks = [];
  let current = '';

  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks;
}
