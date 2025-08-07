import { chunkText } from './chunkText.js';
import { editAndFormat } from './editAndFormat.js';

export function composeScript(intro, chunks, outro) {
  const fullScript = [intro, ...chunks, outro].join('\n\n');
  const cleaned = editAndFormat(fullScript);
  const chunked = chunkText(cleaned); // returns array

  return chunked.join('\n\n'); // final string
}
