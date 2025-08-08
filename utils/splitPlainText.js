export default function splitPlainText(text, maxLength = 4500) {
  const chunks = [];
  let current = '';

  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if ((current + sentence).length <= maxLength) {
      current += (current ? ' ' : '') + sentence;
    } else {
      if (current) chunks.push(current.trim());
      current = sentence;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
