import express from 'express';
import fs from 'fs/promises'; // Using promises API
import path from 'path';
import { openai } from '../utils/openai.js';
import chunkText from '../utils/chunkText.js';
import { getOutroPromptFull } from '../utils/promptTemplates.js';

const router = express.Router();

// Validation middleware
const validateSessionId = (sessionId) => {
  return typeof sessionId === 'string' && 
         sessionId.length <= 64 && 
         /^[a-z0-9-]+$/i.test(sessionId);
};

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { sessionId } = req.body;
    
    // Validate input
    if (!validateSessionId(sessionId)) {
      return res.status(400).json({ 
        error: 'Invalid sessionId - must be alphanumeric with dashes (max 64 chars)' 
      });
    }

    // Generate content
    const prompt = await getOutroPromptFull();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.75,
      messages: [{ role: 'user', content: prompt }],
      timeout: 15000 // 15s timeout
    });

    // Process response
    let rawOutro = completion.choices[0]?.message?.content;
    if (!rawOutro) {
      throw new Error('Empty response from OpenAI');
    }

    // Type-safe processing pipeline
    const processedOutro = await (async () => {
      try {
        // 1. Ensure string type
        const strOutro = String(rawOutro).trim();
        
        // 2. Apply chunking if needed (with fallback)
        const chunked = await chunkText(strOutro).catch(() => strOutro);
        
        // 3. Normalize to string
        return typeof chunked === 'string' ? chunked : JSON.stringify(chunked);
      } catch (err) {
        console.error('Outro processing error:', err);
        return rawOutro; // Fallback to original
      }
    })();

    // Final formatting
    const finalOutro = processedOutro
      .replace(/\n+/g, ' ')      // Flatten newlines
      .replace(/\s{2,}/g, ' ')   // Remove extra spaces
      .trim();

    // Storage handling
    const storageDir = path.join(process.env.DATA_DIR || '/mnt/data', sessionId);
    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(
      path.join(storageDir, 'outro.txt'), 
      finalOutro,
      'utf8'
    );

    // Response
    res.json({
      success: true,
      sessionId,
      outro: finalOutro.slice(0, 200) + (finalOutro.length > 200 ? '...' : ''), // Preview
      storagePath: `${storageDir}/outro.txt`,
      processingTime: `${Date.now() - startTime}ms`
    });

  } catch (err) {
    console.error('❌ Outro generation failed:', err);
    
    // Differentiate error types
    const statusCode = err.response?.status || 
                      err.message.includes('timeout') ? 504 : 500;
    
    res.status(statusCode).json({ 
      error: 'Outro generation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router;
