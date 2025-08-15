import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const DATA_DIR = '/mnt/data';

router.post('/', async (req, res) => {
  try {
    // Debug: Print incoming body
    console.log('--- [DEBUG] Incoming request body:', req.body);

    const { sessionId } = req.body;
    if (!sessionId) {
      console.log('--- [ERROR] Missing sessionId');
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Build paths
    const sessionPath = path.join(DATA_DIR, sessionId);
    const introPath = path.join(sessionPath, 'intro.txt');
    const outroPath = path.join(sessionPath, 'outro.txt');

    // Find main chunk files (main.txt OR chunk-*.txt)
    const filesInDir = fs.existsSync(sessionPath) ? fs.readdirSync(sessionPath) : [];
    const mainChunkFiles = filesInDir
      .filter(f => /^chunk-\d+\.txt$/.test(f))
      .sort((a, b) => {
        // Ensure ordered combining
        const aNum = parseInt(a.match(/^chunk-(\d+)\.txt$/)[1], 10);
        const bNum = parseInt(b.match(/^chunk-(\d+)\.txt$/)[1], 10);
        return aNum - bNum;
      })
      .map(f => path.join(sessionPath, f));
    // If main.txt exists, add it last (after chunks)
    const mainPath = path.join(sessionPath, 'main.txt');
    const mainFiles = mainChunkFiles.length > 0
      ? mainChunkFiles.concat(fs.existsSync(mainPath) ? [mainPath] : [])
      : (fs.existsSync(mainPath) ? [mainPath] : []);

    // Debug: Print built paths
    console.log('--- [DEBUG] Checking file paths:');
    console.log('Intro:', introPath);
    console.log('Main files:', mainFiles);
    console.log('Outro:', outroPath);

    // Check file existence
    const introExists = fs.existsSync(introPath);
    const mainExists = mainFiles.length > 0 && mainFiles.every(f => fs.existsSync(f));
    const outroExists = fs.existsSync(outroPath);

    console.log('--- [DEBUG] File existence:');
    console.log('Intro exists:', introExists);
    console.log('Main exists:', mainExists, '| Files found:', mainFiles.length);
    console.log('Outro exists:', outroExists);

    if (!introExists || !mainExists || !outroExists) {
      return res.status(400).json({
        error: 'One or more transcript parts not found (intro, main, outro)',
        details: {
          introExists,
          mainExists,
          outroExists,
          sessionPath,
          mainFiles
        }
      });
    }

    // Read and concatenate all main files in order
    const mainText = mainFiles
      .map(file => fs.readFileSync(file, 'utf-8').trim())
      .filter(Boolean)
      .join('\n\n');

    // Debug: Print file contents (trimmed for safety)
    console.log('--- [DEBUG] File contents (first 200 chars):');
    console.log('Intro:', fs.readFileSync(introPath, 'utf-8').slice(0, 200));
    console.log('Main:', mainText.slice(0, 200));
    console.log('Outro:', fs.readFileSync(outroPath, 'utf-8').slice(0, 200));

    // Check for empty main
    if (!mainText.trim()) {
      console.log('--- [ERROR] Main script is empty after formatting');
      return res.status(400).json({ error: 'Main script is empty after formatting' });
    }

    // ... continue with your existing logic for OpenAI, episode numbering, etc.

    // For demonstration, return the file contents and debug info
    return res.json({
      status: 'success',
      sessionId,
      sessionPath,
      files: {
        introPath,
        mainFiles,
        outroPath
      },
      exists: {
        introExists,
        mainExists,
        outroExists
      },
      contents: {
        intro: fs.readFileSync(introPath, 'utf-8'),
        main: mainText,
        outro: fs.readFileSync(outroPath, 'utf-8')
      }
    });
  } catch (err) {
    console.error('--- [ERROR] Exception in /compose:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
