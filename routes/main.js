// utils/promptTemplates.js
import getSponsor from './getSponsor.js';
import generateCta from './generateCta.js';
import { getRandomTone } from './toneSetter.js';

const episodeTone = getRandomTone(); // stays fixed for the whole episode

// Helper for subtle variations
function humanize(text) {
  const swaps = {
    "quick": ["quick", "brief", "short"],
    "recent": ["recent", "lately", "these past days"],
    "casually": ["casually", "offhandedly", "lightly"],
    "like it actually means something": [
      "like it actually means something",
      "as if it carries real weight",
      "with just enough gravitas"
    ],
    "Keep it smart, dry, and unmistakably London": [
      "Keep it smart, dry, and unmistakably London",
      "Smart, dry, and distinctly London — keep it that way",
      "Stay smart, stay dry, and keep it unmistakably London"
    ],
    "Wrap up with": ["Wrap up with", "Finish with", "Close out with"]
  };

  return text.replace(
    /\b(?:quick|recent|casually|like it actually means something|Keep it smart, dry, and unmistakably London|Wrap up with)\b/gi,
    match => {
      const lower = match.toLowerCase();
      const options = swaps[match] || swaps[lower];
      return options ? options[Math.floor(Math.random() * options.length)] : match;
    }
  );
}

export function getMainPrompt({ title, url, weatherSummary, turingQuote }) {
  const sponsor = getSponsor();
  const cta = generateCta(sponsor);

  return humanize(`You’re the British Gen X host of Turing's Torch: AI Weekly.
Tone for this episode: ${episodeTone}.

Wrap up with a brief, wry reflection, making sure the podcast name — Turing's Torch: AI Weekly — is clearly mentioned.
Reference this ebook like it’s one of your own: "${title}" (link: ${url}).
Keep the tone relaxed, confident, and lightly sarcastic — nothing forced.
End with this call to action: ${cta}.
Plain text only — no breaks or formatting.`);
}

// ✅ Added so `import getMainPrompt from '../utils/promptTemplates.js'` works
export default getMainPrompt;
