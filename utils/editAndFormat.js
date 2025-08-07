import { cleanTranscript, formatTitle, normaliseKeywords } from './textHelpers.js';
import chunkText from './chunkText.js';

export default function editAndFormat({ intro, main, outro, title, description, keywordsRaw }) {
  const transcript = cleanTranscript(`${intro}\n\n${main}\n\n${outro}`);
  const ttsChunks = chunkText(transcript);
  const keywords = normaliseKeywords(keywordsRaw);
  const formattedTitle = formatTitle(title);

  return {
    title: formattedTitle,
    description: description.trim(),
    transcript,
    ttsChunks,
    keywords
  };
}
