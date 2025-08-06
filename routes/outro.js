import express from 'express';
import OpenAI from '../utils/openai.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRandomItem } from '../utils/podcastHelpers.js';

const router = express.Router();

// Get file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load books.json manually (no assert syntax)
const booksPath = path.join(__dirname, '../utils/books.json');
const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

/**
 * Outro endpoint
 * Generates a witty British Gen X outro for Turing's Torch: AI Weekly
 * Automatically includes Jonathan Harris as host and a random book sponsor
 */
router.post('/', async (req, res) => {
  try {
    const { prompt: externalPrompt } = req.body;

    // Pick a random book sponsor
    const bookSponsor = getRandomItem(books);

    const systemPrompt = `
      Write a confident, witty podcast outro for "Turing’s Torch: AI Weekly" 
      with a British Gen X tone—dry humour, cultural nods, and a touch of sarcasm.

      Always:
      - Mention the host Jonathan Harris
      - Mention the podcast name
      - Include a sign-off
      - Include this book as a cheeky sponsor: "${bookSponsor.title}" by ${bookSponsor.author}
      - Encourage visiting jonathan-harris.online and subscribing to the newsletter.
    `;

    const userPrompt = externalPrompt || `
      And that’s your lot for this week on Turing’s Torch: AI Weekly. 
      We’ll be back next Friday—unless the machines beat us to it. 
      Until then, sharpen your minds with jonathan-harris.online. 
      Think of it as your weekly firewall against ignorance. 
      I’m Jonathan Harris, signing off before the AI replaces me with a hologram. Cheers.
    `;

    const completion = await OpenAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8
    });

    const outroText = completion.choices[0].message.content;

    res.json({
      outro: outroText,
      sponsor: {
        title: bookSponsor.title,
        author: bookSponsor.author
      }
    });

  } catch (error) {
    console.error('Error generating outro:', error);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

export default router;
