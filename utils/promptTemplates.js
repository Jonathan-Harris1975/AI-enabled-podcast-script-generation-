
// utils/promptTemplates.js

export function getIntroPrompt({ hostName, weatherSummary, turingQuote }) {
  return `You're the dry-witted, Gen X British host of 'Turing's Torch: AI Weekly', a 10-minute podcast about AI news.
Open with a clever comment about the recent UK weather: ${weatherSummary}
Then segue into an Alan Turing quote: "${turingQuote}"
Introduce yourself as ${hostName}, the host and AI wrangler.
Do not mention episode numbers or clickbait.
Maintain a sarcastic, intelligent, culturally aware tone throughout.`;
}

export function getMainPrompt(articleTextArray) {
  return `Rewrite each AI news summary as a standalone podcast segment.
Tone: intelligent, sarcastic British Gen X — dry wit, cultural commentary, and confident delivery.
For each article:
- Start with a dry joke or clever one-liner
- Explain the topic clearly
- Use natural phrasing
- Avoid repetition

Here are the stories:
${articleTextArray.join('\n')}`;
}

export function getOutroPrompt({ hostName, sponsorTitle, sponsorURL }) {
  return `Write a short podcast outro for a British Gen X host named ${hostName}.
Wrap up the episode with a witty remark.
Mention the sponsor eBook titled "${sponsorTitle}" available now at ${sponsorURL}
End with a casual goodbye. Keep it under 40 seconds.`;
}
