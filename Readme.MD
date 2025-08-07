


---

# 🎙 Podcast Script generation API

## **Base URL**

http://localhost:3000

---

## **1. Health Check**
### `GET /health`
Checks if the API is running.

**Response:**
```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2025-08-06T12:00:00.000Z"
}

Curl Example:

curl http://localhost:3000/health


---

2. Generate Intro

POST /intro

Generates an intro section.
Adds optional weather (by date) and Alan Turing quote.
Custom prompt overrides default intro template.

Payload:

{
  "sessionId": "abc123",
  "date": "2025-08-06",
  "prompt": "Write a funny AI-themed intro in pirate style"
}

Curl Example:

curl -X POST http://localhost:3000/intro \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc123","date":"2025-08-06","prompt":"Write a funny AI-themed intro in pirate style"}'

Response:

{
  "sessionId": "abc123",
  "content": "Arr matey, welcome to the high seas of AI..."
}


---

3. Generate Main

POST /main

Fetches AI news from an RSS feed and generates witty summaries.

Payload:

{
  "sessionId": "abc123",
  "rssUrl": "https://venturebeat.com/feed/",
  "maxItems": 3,
  "prompt": "Summarise in a sarcastic tone"
}

Curl Example:

curl -X POST http://localhost:3000/main \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc123","rssUrl":"https://venturebeat.com/feed/","maxItems":3,"prompt":"Summarise in a sarcastic tone"}'

Response:

{
  "sessionId": "abc123",
  "result": [
    "AI did something big today...",
    "Another AI milestone, or so they say..."
  ]
}


---

4. Generate Outro

POST /outro

Generates an outro section.
Uses random sponsor book unless prompt overrides it.

Payload:

{
  "sessionId": "abc123",
  "prompt": "Create a poetic outro with a Shakespearean vibe"
}

Curl Example:

curl -X POST http://localhost:3000/outro \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc123","prompt":"Create a poetic outro with a Shakespearean vibe"}'

Response:

{
  "sessionId": "abc123",
  "content": "Thus ends our tale in the realm of silicon dreams..."
}


---

5. Compose Final Script + Metadata

POST /compose

Combines intro, main, and outro into final script.
Generates title, description, SEO keywords, and artwork prompt.

Payload:

{
  "sessionId": "abc123",
  "intro": "Optional intro text",
  "main": ["Optional", "main", "summaries"],
  "outro": "Optional outro text",
  "editorPrompt": "Rewrite with a noir detective style"
}

If intro, main, or outro are missing, they are fetched from in‑memory cache.

Curl Example:

curl -X POST http://localhost:3000/compose \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc123"}'

Response:

{
  "sessionId": "abc123",
  "transcript": "Full edited podcast script...",
  "title": "AI Under the Streetlamp",
  "description": "A noir dive into the latest AI happenings.",
  "seo_keywords": "ai tools, machine learning, AI in business",
  "artwork_prompt": "Dark alley lit by neon AI circuits"
}


---

6. Clear Session

POST /clear-session

Removes all cached sections for a given sessionId.

Payload:

{
  "sessionId": "abc123"
}

Curl Example:

curl -X POST http://localhost:3000/clear-session \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"abc123"}'

Response:

{
  "message": "Session cleared"
}


---

HTTP Summary

Endpoint	Method	Auth Required	Request Body	Response

/health	GET	No	None	Status info
/intro	POST	No	JSON	Intro text
/main	POST	No	JSON	Array of summaries
/outro	POST	No	JSON	Outro text
/compose	POST	No	JSON	Final script + metadata
/clear-session	POST	No	JSON	Confirmation message


---

Do you want me to also add this README.md file to the **final repo folder bundle** so it’s zipped with all the routes and utils? That way everything is ready for commit.

