export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  mockAi: String(process.env.MOCK_AI || "false").toLowerCase() === "true",
  defaultRssUrl:
    process.env.DEFAULT_RSS_URL || "https://venturebeat.com/feed/",
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS || 3600)
};
