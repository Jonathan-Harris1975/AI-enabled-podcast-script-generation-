// routes/main.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import getMainPrompt from '../utils/promptTemplates.js';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Persistent storage directory (Render keeps /opt/render/project/data between deploys)
const storageDir = '/opt/render/project/data';

router.post('/', async (req, res) => {
  try {
    const { title, url } = req.body;

    // Create main prompt
    const promptText = getMainPrompt({ title, url });

    // Get AI result
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.7
    });

    const aiResult = aiResponse.choices[0].message.content.trim();

    // Ensure storage folder exists
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // Save just the result to a text file
    const filePath = path.join(storageDir, `result_${Date.now()}.txt`);
    fs.writeFileSync(filePath, aiResult, 'utf-8');

    // Respond to client
    res.json({
      message: 'Result saved',
      savedTo: filePath,
      result: aiResult
    });

  } catch (error) {
    console.error('Error running main prompt:', error);
    res.status(500).json({ error: 'Failed to run main prompt' });
  }
});

export default router;
