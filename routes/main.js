import express from 'express';
import fs from 'fs';
import path from 'path';
import { openai } from '../utils/openai.js';
import fetchFeeds from '../utils/fetchFeeds.js';
import { saveToMemory } from '../utils/memoryCache.js';
import { getMainPrompt } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/', async (req, res) => {
try {
const { rssFeedUrl, sessionId } = req.body;

if (!rssFeedUrl || !sessionId) {  
  return res.status(400).json({ error: 'Missing required fields' });  
}  

const articles = await fetchFeeds(rssFeedUrl, { maxAgeDays: 7, limit: 40 });  
const articleTextArray = articles.map(  
  (a, i) => `${i + 1}. ${a.title} - ${a.summary}`  
);  

const inputPrompt = getMainPrompt(articleTextArray);  

const completion = await openai.chat.completions.create({  
  model: 'gpt-4',  
  temperature: 0.75,  
  messages: [{ role: 'user', content: inputPrompt }]  
});  

let chunks = completion.choices[0].message.content  
  .split(/\n\n+/)  
  .filter(Boolean)  
  .map(chunk => chunk.trim());  

// Ensure each chunk is between 2000–4000 characters  
chunks = chunks.filter(chunk => {  
  const len = chunk.length;  
  return len >= 500 && len <= 5000;  
});  

if (chunks.length === 0) {  
  throw new Error('No chunks met the character length requirement (500-4000 characters).');  
}  

const storageDir = path.resolve('/mnt/data', sessionId);  
fs.mkdirSync(storageDir, { recursive: true });  

chunks.forEach((chunk, i) => {  
  const filePath = path.join(storageDir, `raw-chunk-${i + 1}.txt`);  
  fs.writeFileSync(filePath, chunk);  
});  

await saveToMemory(sessionId, 'mainChunks', chunks);  

const chunkPaths = chunks.map((_, i) => `/mnt/data/${sessionId}/raw-chunk-${i + 1}.txt`);  

res.json({  
  sessionId,  
  chunkPaths  
});

} catch (err) {
console.error('❌ Main route error:', err);
res.status(500).json({ error: 'Podcast generation failed', details: err.message });
}
});

export default router;
