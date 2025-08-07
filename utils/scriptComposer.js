import chunkText from './chunkText.js';
import editAndFormat from './editAndFormat.js';

function composeScript(intro, chunks, outro) {
  const fullScript = [intro, ...chunks, outro].join('\n\n');
  const cleaned = editAndFormat(fullScript);
  const chunked = chunkText(cleaned);
  return chunked.join('\n\n');
}

export default composeScript;
