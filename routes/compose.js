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
    const mainPath = path.join(sessionPath, 'main.txt');
    const outroPath = path.join(sessionPath, 'outro.txt');

    // Debug: Print built paths
    console.log('--- [DEBUG] Checking file paths:');
    console.log('Intro:', introPath);
    console.log('Main:', mainPath);
    console.log('Outro:', outroPath);

    // Check file existence
    const introExists = fs.existsSync(introPath);
    const mainExists = fs.existsSync(mainPath);
    const outroExists = fs.existsSync(outroPath);

    console.log('--- [DEBUG] File existence:');
    console.log('Intro exists:', introExists);
    console.log('Main exists:', mainExists);
    console.log('Outro exists:', outroExists);

    if (!introExists || !mainExists || !outroExists) {
      return res.status(400).json({
        error: 'One or more transcript parts not found (intro, main, outro)',
        details: {
          introExists,
          mainExists,
          outroExists,
          sessionPath
        }
      });
    }

    // Read contents
    const introText = fs.readFileSync(introPath, 'utf-8');
    const mainText = fs.readFileSync(mainPath, 'utf-8');
    const outroText = fs.readFileSync(outroPath, 'utf-8');

    // Debug: Print file contents (trimmed for safety)
    console.log('--- [DEBUG] File contents (first 200 chars):');
    console.log('Intro:', introText.slice(0, 200));
    console.log('Main:', mainText.slice(0, 200));
    console.log('Outro:', outroText.slice(0, 200));

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
        mainPath,
        outroPath
      },
      exists: {
        introExists,
        mainExists,
        outroExists
      },
      contents: {
        intro: introText,
        main: mainText,
        outro: outroText
      }
    });
  } catch (err) {
    console.error('--- [ERROR] Exception in /compose:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
