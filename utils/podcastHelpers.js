// utils/podcastHelpers.js

/**
 * Split text into <= 4500 character chunks for TTS.
 * @param {string} text
 * @returns {string[]} array of text chunks
 */
function splitTextForTTS(text) {
  if (!text) return [];
  const maxLen = 4500;
  const chunks = [];
  let current = '';

  for (const paragraph of text.split(/\n+/)) {
    if ((current + paragraph).length <= maxLen) {
      current += (current ? '\n' : '') + paragraph;
    } else {
      if (current) chunks.push(current);
      if (paragraph.length > maxLen) {
        // Break big paragraph
        for (let i = 0; i < paragraph.length; i += maxLen) {
          chunks.push(paragraph.slice(i, i + maxLen));
        }
        current = '';
      } else {
        current = paragraph;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Prompt generator for title and description
 * @param {string} newsItemsText - Concatenated news items
 */
function getTitleDescriptionPrompt(newsItemsText) {
  return `Based on the following AI news summaries, generate two things:
1. A short, punchy episode title (max 10 words) that captures the dominant theme or most intriguing idea. No hashtags, no colons, no episode numbers. Capitalise major words.
2. A brief podcast episode description (max 300 characters). Write it in a clear, human tone. Summarise the items collectively — don’t list them individually. Avoid phrases like "this episode" or "we cover." Just write it like a Spotify show blurb.

News Items: ${newsItemsText}

Respond in the following JSON format only:
{  "title": "Your punchy episode title here",  "description": "Your engaging episode summary here"}`;
}

/**
 * Prompt generator for SEO keywords
 * @param {string} episodeDescription
 */
function getSEOKeywordsPrompt(episodeDescription) {
  return `Extract 8–14 SEO-optimised keywords and phrases based on the following episode descriptions. Focus on short, high-impact terms relevant to AI, tech, business, ethics, innovation, or current trends. Prioritise phrases that people might realistically search for on Spotify, Apple Podcasts, Google, or YouTube. Include a mix of:
- 1–2-word keywords (e.g. "AI tools", "machine learning")
- 2–4-word search-friendly phrases (e.g. "AI in healthcare", "AI legal tech")
Avoid hashtags, duplicate terms, or clickbait. Format as a comma-separated list only — no explanations, no quotes, no headings.

Episode description: ${episodeDescription}`;
}

/**
 * Prompt generator for artwork prompt
 * @param {string} episodeSummary
 */
function getArtworkPrompt,
  getTranscriptPrompt(episodeSummary) {
  return `Turn the following podcast episode summary into a vivid, artistic image prompt under 100 characters. Avoid any text, branding, or logos. Focus on abstract or conceptual visuals.

Episode Summary: ${episodeSummary}`;
}



/**
 * Clean transcript for publishing by removing stage directions or prompts.
 * @param {string} episodeText
 * @returns {string} cleaned transcript
 */
function getTranscriptPrompt(episodeText) {
  if (!episodeText) return '';
  // Remove [bracketed directions], excessive whitespace
  let cleaned = episodeText.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned;
}

module.exports = {
  splitTextForTTS,
  getTitleDescriptionPrompt,
  getSEOKeywordsPrompt,
  getArtworkPrompt,
  getTranscriptPrompt
};
