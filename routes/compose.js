import express from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import splitPlainText from '../utils/splitPlainText.js';
import editAndFormat from '../utils/editAndFormat.js';
import uploadChunksToR2 from '../utils/uploadChunksToR2.js';
import uploadToR2 from '../utils/uploadToR2.js';

const router = express.Router();

router.post('/compose', async (req, res) => {
  try {
    const { sessionId, rawText } = req.body;
    if (!sessionId || !rawText) {
      return res.status(400).json({ error: 'Missing sessionId or rawText' });
    }

    const storageDir = path.resolve('/mnt/data', sessionId);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // 1. Edit & format raw text
    const editedText = await editAndFormat(rawText);

    // 2. Split into chunks (max 4500 chars)
    const chunks = splitPlainText(editedText, 4500);

    // 3. Save full transcript locally
    const transcriptPath = path.join(storageDir, 'final-transcript.txt');
    fs.writeFileSync(transcriptPath, editedText, 'utf-8');

    // 4. Upload full transcript to R2
    const transcriptUrl = await uploadToR2(transcriptPath, `final-text/${sessionId}/final-transcript.txt`);

    // 5. Upload chunks to R2
    const chunkUrls = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const key = `final-text/${sessionId}/chunk-${i + 1}.txt`;
      const tempFilePath = path.join(os.tmpdir(), `upload-chunk-${sessionId}-${i + 1}.txt`);

      fs.writeFileSync(tempFilePath, chunk, 'utf-8');

      const url = await uploadChunksToR2(tempFilePath, key);

      fs.unlinkSync(tempFilePath); // clean temp

      chunkUrls.push(url);
    }

    // Respond with all URLs and transcript
    res.json({
      sessionId,
      transcriptUrl,
      chunkUrls,
      chunks,
      fullTranscript: editedText
    });
  } catch (err) {
    console.error('Compose/upload error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
