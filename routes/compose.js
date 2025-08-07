import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import chunkText from '../utils/chunkText.js';
import { cleanTranscript, formatTitle, normaliseKeywords } from '../utils/textHelpers.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import r2Client from '../utils/r2Client.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    const basePath = path.resolve(`./storage/${sessionId}`);
    const read = async (file) => {
      const fullPath = path.join(basePath, file);
      return (await fs.readFile(fullPath, 'utf8')).trim();
    };

    const [intro, main, outro, titleRaw, descriptionRaw, keywordsRaw, artPrompt] = await Promise.all([
      read('intro.txt'),
      read('main.txt'),
      read('outro.txt'),
      read('title.txt'),
      read('description.txt'),
      read('keywords.txt'),
      read('artPrompt.txt')
    ]);

    const transcript = cleanTranscript(`${intro}\n\n${main}\n\n${outro}`);
    const ttsChunks = chunkText(transcript);
    const keywords = normaliseKeywords(keywordsRaw);
    const title = formatTitle(titleRaw);
    const description = descriptionRaw.trim();

    const objectKey = `${sessionId}.txt`;
    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      Body: transcript,
      ContentType: 'text/plain'
    }));

    const transcriptUrl = `${process.env.R2_PUBLIC_BASE_URL}/${process.env.R2_BUCKET}/${objectKey}`;

    res.status(200).json({
      title,
      description,
      keywords,
      artPrompt,
      transcriptUrl,
      ttsChunks
    });

  } catch (err) {
    console.error('❌ Compose session merge failed:', err.message);
    res.status(500).json({ error: 'Failed to generate full podcast output.' });
  }
});

export default router;    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: objectKey,
      Body: transcript,
      ContentType: 'text/plain'
    }));

    const transcriptUrl = `${process.env.R2_PUBLIC_BASE_URL}/${process.env.R2_BUCKET}/${objectKey}`;

    res.status(200).json({
      title,
      description,
      keywords,
      artPrompt,
      transcriptUrl,
      ttsChunks
    });

  } catch (err) {
    console.error('❌ Compose session merge failed:', err.message);
    res.status(500).json({ error: 'Failed to generate full podcast output.' });
  }
});

export default router;
