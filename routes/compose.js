import express from 'express';
import { generateIntro } from './intro.js';
import { generateMain } from './main.js';
import { generateOutro } from './outro.js';
import openai from '../services/openai.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    let { intro, main, outro } = req.body;

    // Generate missing sections
    if (!intro) {
      intro = await generateIntro(req.body);
    }
    if (!main) {
      main = await generateMain(req.body);
    }
    if (!outro) {
      outro = await generateOutro(req.body);
    }

    // Combine into full script
    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content:
            'You are a witty British Gen X podcast script editor for "Turing’s Torch: AI Weekly", hosted by Jonathan Harris. Merge intro, main, and outro into a single polished script, keeping tone dry, clever, and culturally aware.'
        },
        {
          role: 'user',
          content: `Intro:\n${intro}\n\nMain:\n${main}\n\nOutro:\n${outro}`
        }
      ]
    });

    const script = scriptResponse.choices[0]?.message?.content || '';

    // Generate metadata
    const metadataResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content:
            'You are a podcast content strategist. Based on the provided script, generate a JSON object with: "title", "description", "seoKeywords", and "artworkPrompt". Keep it relevant to "Turing’s Torch: AI Weekly" and the British Gen X tone.'
        },
        { role: 'user', content: script }
      ]
    });

    const metadataRaw =
      metadataResponse.choices[0]?.message?.content || '{}';
    let metadata;
    try {
      metadata = JSON.parse(metadataRaw);
    } catch (e) {
      metadata = {
        title: '',
        description: '',
        seoKeywords: [],
        artworkPrompt: ''
      };
    }

    res.json({
      intro,
      main,
      outro,
      script,
      metadata
    });
  } catch (error) {
    console.error('Error in /compose:', error);
    res.status(500).json({ error: 'Error composing podcast script' });
  }
});

export default router;
