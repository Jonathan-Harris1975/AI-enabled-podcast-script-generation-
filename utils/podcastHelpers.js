// utils/podcastHelpers.js

function getTitleDescriptionPrompt(transcript) {
  return `Based on the following AI news summaries, generate two things:
1. A short, punchy episode title (max 10 words) that captures the dominant theme or most intriguing idea. No hashtags, no colons, no episode numbers. Capitalise major words.
2. A brief podcast episode description (max 300 characters). Write it in a clear, human tone, first person singular (use "I", never "we"). Summarise the items collectively — don’t list them individually. Avoid phrases like "this episode" or "I cover." Just write it like a Spotify show blurb.

News Items:
${transcript}

Respond in the following JSON format only:
{
  "title": "Your punchy episode title here",
  "description": "Your engaging episode summary here"
}`;
}

function getSEOKeywordsPrompt(description) {
  return `Extract 8–14 SEO-optimised keywords and phrases based on the following episode description. 
Focus on short, high-impact terms relevant to AI, tech, business, ethics, innovation, or current trends. 
Prioritise phrases that people might realistically search for on Spotify, Apple Podcasts, Google, or YouTube. 
Include a mix of:
- 1–2-word keywords (e.g. "AI tools", "machine learning")
- 2–4-word search-friendly phrases (e.g. "AI in healthcare", "AI legal tech")
Avoid hashtags, duplicate terms, or clickbait. 
Format as a comma-separated list only — no explanations, no quotes, no headings.

Episode description:
${description}`;
}

function getArtworkPrompt(description) {
  return `Create a cinematic, abstract digital artwork inspired by this summary. 
Use a futuristic, sleek AI theme with neon lighting and geometric shapes. 
Focus on bold visual metaphors, striking lighting, and conceptual elements. 
Avoid text, branding, or logos. Make it surreal yet professional, suitable for podcast cover art. 
Keep the core visual idea under 100 characters.

Episode Summary:
${description}`;
}

export { getTitleDescriptionPrompt, getSEOKeywordsPrompt, getArtworkPrompt };
