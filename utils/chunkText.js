export default function chunkText(text, maxChars = 4500) {
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];

  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxChars) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += '\n\n' + para;
    }
  }

  if (current) chunks.push(current.trim());

  return chunks;
}
