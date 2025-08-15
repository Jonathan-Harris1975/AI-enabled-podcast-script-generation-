import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sessionDir = path.resolve('/mnt/data', sessionId);

    // Files to clear
    const filesToDelete = [
      'intro.txt',
      'main.txt',
      'outro.txt',
      'final-full-transcript.txt'
    ];

    let deletedFiles = [];
    filesToDelete.forEach(file => {
      const filePath = path.join(sessionDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        } catch (err) {
          console.error(`Failed to delete ${filePath}:`, err);
        }
      }
    });

    res.json({
      message: `Cleared session ${sessionId} files from persistent storage`,
      deleted: deletedFiles
    });
  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
