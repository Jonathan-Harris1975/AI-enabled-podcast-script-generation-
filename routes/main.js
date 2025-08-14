import { Router } from "express";
import { MainSchema } from "../utils/schemas.js";
import { fetchRssItems } from "../utils/rss.js";
import { setSessionPart } from "../utils/cache.js";
import { generateText } from "../utils/ai.js";
import { config } from "../config.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { sessionId, rssUrl, maxItems = 3, prompt } = MainSchema.parse(
      req.body
    );
    const url = rssUrl || config.defaultRssUrl;

    const { title, items } = await fetchRssItems(url, maxItems);

    const system =
      "You turn tech headlines into one-liner, witty summaries. Keep each item crisp, 1-2 sentences, with a light comedic touch but no sarcasm that distorts facts.";
    const newsText =
      items
        .map(
          (i, idx) =>
            `#${idx + 1} ${i.title}\nLink: ${i.link}\nDate: ${i.isoDate}\nSnippet: ${i.contentSnippet || i.content || ""}`
        )
        .join("\n\n") || "No items found.";

    const userPrompt = `Source Feed: ${title || "Unknown"}\n\nSummarize the ${items.length} items as a list of punchy bullets suitable for reading aloud on a podcast.\n${prompt ? `\nTone/style guidance: ${prompt}\n` : ""}\nItems:\n${newsText}`;

    const resultBlob = await generateText({ system, prompt: userPrompt });
    const result = resultBlob
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setSessionPart(sessionId, "main", result, config.sessionTtlSeconds);
    res.json({ sessionId, result });
  } catch (err) {
    next(err);
  }
});

export default router;
