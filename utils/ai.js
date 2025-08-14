import { config } from "../config.js";
import { logger } from "./logger.js";

// Thin wrapper that can be swapped to different providers if needed.
export async function generateText({ system, prompt }) {
  if (config.mockAi) {
    return `MOCKED: ${prompt?.slice(0, 140)}`;
  }

  if (!config.openaiApiKey) {
    logger.warn("OPENAI_API_KEY missing; falling back to MOCK_AI");
    return `MOCKED_NO_KEY: ${prompt?.slice(0, 140)}`;
  }

  // OpenAI SDK v4
  const { OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey: config.openaiApiKey });

  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      ...(system ? [{ role: "system", content: system }] : []),
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  const text =
    response.choices?.[0]?.message?.content?.trim() ||
    "Sorry, I couldn't generate content.";
  return text;
}
