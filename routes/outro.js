import express from 'express';
import { openai } from '../utils/openai.js';
import { sanitizeText } from '../utils/sanitize.js';
import { storeSection } from '../utils/memoryCache.js';
import { outroPromptWithSponsor } from '../utils/promptTemplates.js';

const router = express.Router();

router.post('/outro', async (req, res) => {
  const { sessionId, prompt } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let promptContent;

    if (prompt) {
      // Append book sponsor to provided prompt
      const sponsorPrompt = outroPromptWithSponsor();
      promptContent = `${prompt}\n\nInclude sponsor details:\n${sponsorPrompt}`;
    } else {
      // Use default Gen X outro with sponsor
      promptContent = outroPromptWithSponsor();
    }

    const systemMessage = `Write a confident, witty podcast outro for Turing’s Torch: AI Weekly in a dry British Gen X tone. 
New episodes drop every Friday. And that’s your lot for this week on Turing’s Torch: AI Weekly. 
We’ll be back next Friday—unless the machines beat us to it. 
Until then, sharpen your minds with jonathan-harris.online. 
While you’re there, subscribe to the newsletter—think of it as your weekly firewall against ignorance. 
I'm Jonathan Harris, signing off before the AI replaces me with a hologram. Cheers.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.75,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: promptContent }
      ]
    });

    const content = sanitizeText(resp.choices[0].message.content);
    storeSection(sessionId, 'outro', content);

    res.json({ sessionId, content });
  } catch (error) {
    console.error('Outro error:', error.message);
    res.status(500).json({ error: 'Outro generation failed', details: error.message });
  }
});

export default router;
