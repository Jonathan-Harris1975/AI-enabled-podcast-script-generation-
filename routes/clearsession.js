import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const sessionPath = path.resolve('/mnt/data', sessionId);

  fs.rm(sessionPath, { recursive: true, force: true }, (err) => {
    if (err) {
      console.error('Error clearing session:', err);
      return res.status(500).json({ error: 'Failed to clear session data' });
    }
    res.status(200).json({ message: 'Session cleared' });
  });
});

export default router;
