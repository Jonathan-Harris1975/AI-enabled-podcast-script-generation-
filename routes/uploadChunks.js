import express from 'express';
import fs from 'fs';
import path from 'path';
import uploadChunksToR2 from '../utils/uploadChunksToR2.js'; // Your upload util

const router = express.Router();

router.post('/upload-chunks', async (req, res) => {
  const { finalChunks, sessionId, storageDir } = req.body;

  if (!finalChunks || !sessionId || !storageDir) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    let chunkUrls = [];

    for (let i = 0; i < finalChunks.length; i++) {
      const chunk = finalChunks[i];
      const key = `final-text/${sessionId}/chunk-${i + 1}.txt`;
      const tempFilePath = path.join(storageDir, `upload-chunk-${i + 1}.txt`);

      // Write chunk text to temp file
      fs.writeFileSync(tempFilePath, chunk, 'utf-8');

      // Upload chunk file to R2
      await uploadChunksToR2(tempFilePath, key);

      // Optionally delete temp file after upload
      // fs.unlinkSync(tempFilePath);

      chunkUrls.push(`${process.env.R2_PUBLIC_BASE_URL_1}/${process.env.R2_BUCKET_CHUNKS}/${key}`);
    }

    return res.status(200).json({ chunkUrls });
  } catch (uploadErr) {
    console.error('❌ Upload chunks to R2 failed:', uploadErr);
    return res.status(500).json({ error: 'Upload chunks to R2 failed', details: uploadErr.message });
  }
});

export default router;
