import express from 'express';
import fs from 'fs';
import path from 'path';

import editAndFormat from '../utils/editAndFormat.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const storageDir = path.resolve('/mnt/data', sessionId);
    const introPath = path.join(storageDir, 'intro.txt');
    const outroPath = path.join(storageDir, 'outro.txt');

    if (!fs.existsSync(introPath) || !fs.existsSync(outroPath)) {
      return res.status(400).json({ error: 'Intro or outro not found' });
    }

    const intro = fs.readFileSync(introPath, 'utf-8').trim();
    const outro = fs.readFileSync(outroPath, 'utf-8').trim();

    const mainChunks = fs
      .readdirSync(storageDir)
      .filter(f => f.startsWith('raw-chunk-'))
      .sort()
      .map(f => fs.readFileSync(path.join(storageDir, f), 'utf-8').trim());

    // Clean and flatten all chunks
    const cleanedChunks = await Promise.all(
  [intro, ...mainChunks, outro].map(async chunk => {
    const edited = await editAndFormat(chunk);
    return edited.replace(/\n+/g, ' ');
  })
);


    // 🔀 Random tone selection
    const tones = ['cheeky', 'reflective', 'high-energy', 'dry as hell', 'overly sincere', 'oddly poetic'];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    console.log(`🎙️ Selected tone: ${tone}`);

    // Save final array of chunks + tone to file
    const output = {
      tone,
      chunks: cleanedChunks
    };

    const outputPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    res.json({ sessionId, ...output });

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final chunks' });
  }
});

export default router;    return edited.replace(/\n+/g, ' ');
  })
);
    );

    // 🔀 Random tone selection
    const tones = ['cheeky', 'reflective', 'high-energy', 'dry as hell', 'overly sincere', 'oddly poetic'];
    const tone = tones[Math.floor(Math.random() * tones.length)];
    console.log(`🎙️ Selected tone: ${tone}`);

    // Save final array of chunks + tone to file
    const output = {
      tone,
      chunks: cleanedChunks
    };

    const outputPath = path.join(storageDir, 'final-chunks.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    res.json({ sessionId, ...output });

  } catch (err) {
    console.error('❌ Compose error:', err);
    res.status(500).json({ error: 'Failed to compose final chunks' });
  }
});

export default router;
