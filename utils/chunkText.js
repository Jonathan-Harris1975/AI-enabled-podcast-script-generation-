// utils/chunkText.js

export function chunkText(text, maxLength = 4500) {
  const chunks = [];
  let currentChunk = '';

  for (const paragraph of text.split('\n\n')) {
    if ((currentChunk + '\n\n' + paragraph).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += '\n\n' + paragraph;
    }
  }

  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}
