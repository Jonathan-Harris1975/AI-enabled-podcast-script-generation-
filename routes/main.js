import express from 'express';
import fetchFeed from '../utils/fetchFeed.js';
import getWeatherSummary from '../utils/weather.js';
import { openai } from '../utils/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('🌍 Starting main podcast script generation...');

    const { prompt } = req.body;

    // 1. Fetch articles
    console.log('📡 Fetching feed...');
    const articles = await fetchFeed();
    console.log('✅ Fetched articles:', Array.isArray(articles) ? articles.length : 'Invalid');

    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('No valid articles were fetched from feed.');
    }

    // 2. Build summary from articles
    const articleSummary = articles.map((article, i) =>
      `${i + 1}. ${article.title} - ${article.summary}`
    ).join('\n');

    // 3. Get weather
    const weather = getWeatherSummary();
    console.log('🌦️ Weather summary:', weather);

    // 4. Construct full prompt
    const systemPrompt = `
You are the host of a weekly British podcast called "Turing's Torch". 
Tone: sarcastic British Gen X, intelligent, culturally self-aware. 
Your job is to deliver a confident, witty, and informative commentary.

Start the podcast by saying: 
"I’m your host, Jonathan Harris. And this is Turing’s Torch — your weekly update on the rise (or fall) of <say-as interpret-as="characters">A I</say-as>."

Today’s tech weather: ${weather}

Here are this week’s top <say-as interpret-as="characters">A I</say-as> stories:
${articleSummary}

Now turn these into a cohesive, insightful podcast script — in your voice.
Use dry humour, punchy delivery, and smart transitions.
`;

    const fullPrompt = `${systemPrompt}\n\n${prompt || ''}`;

    // 5. Generate response from OpenAI
    console.log('🧠 Sending to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: fullPrompt }],
    });

    const message = completion.choices[0]?.message?.content?.trim();
    if (!message) {
      throw new Error('OpenAI response was empty or invalid.');
    }

    console.log('✅ OpenAI response generated.');
    res.status(200).json({ script: message });

  } catch (err) {
    console.error('❌ Error in /main:', err.message || err);
    res.status(500).json({ error: 'Failed to process feed or generate podcast script.' });
  }
});

export default router;
