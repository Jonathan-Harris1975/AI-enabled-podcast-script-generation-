export default function chunkText(text, maxLength = 4500) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end > text.length) {
      end = text.length;
    } else {
      const lastPeriod = text.lastIndexOf('.', end);
      if (lastPeriod > start) end = lastPeriod + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks;
}