import { Router } from "express";
import { IntroSchema } from "../utils/schemas.js";
import { setSessionPart } from "../utils/cache.js";
import { generateText } from "../utils/ai.js";
import { config } from "../config.js";

const router = Router();

// Optional Alan Turing quote pool
const TURING_QUOTES = [
  "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
  "Those who can imagine anything, can create the impossible.",
  "A computer would deserve to be called intelligent if it could deceive a human into believing that it was human."
];

// Simple (mock) UK weather blurb by date to show the hook without external API
function weatherLine(dateStr) {
  if (!dateStr) return "";
  // lightweight deterministic “weather” line (no network dep)
  const day = new Date(dateStr + "T00:00:00Z").getUTCDate();
  const moods = [
    "sunny spells",
    "light showers",
    "overcast skies",
    "breezy conditions",
    "warm and bright",
    "cool with scattered clouds"
  ];
  return `In the UK today (${dateStr}), expect ${moods[day % moods.length]}.`;
}

router.post("/", async (req, res, next) => {
  try {
    const { sessionId, date, prompt } = IntroSchema.parse(req.body);

    const system =
      "You craft short, witty podcast intros. Tone defaults to friendly, crisp and smart.";
    const turing = TURING_QUOTES[(Math.abs(sessionId.length) + (date ? date.length : 0)) % TURING_QUOTES.length];
    const weather = weatherLine(date);
    const base = `Write a podcast intro that welcomes listeners, tees up an AI/tech news segment, and sets an upbeat tone in 3-5 sentences.${weather ? ` Include this weather line verbatim: "${weather}"` : ""} Also weave in this Alan Turing quote if it fits naturally: "${turing}"`;

    const content = await generateText({
      system,
      prompt: prompt ? `${base}\n\nExtra guidance: ${prompt}` : base
    });

    setSessionPart(sessionId, "intro", content, config.sessionTtlSeconds);
    res.json({ sessionId, content });
  } catch (err) {
    next(err);
  }
});

export default router;
