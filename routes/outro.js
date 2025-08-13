import express from 'express';
import generateOutroPath from '../utils/generateOutroPath.js'; // util you'll provide

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Generate outro path — replace with your actual util logic
    const outroPath = await generateOutroPath(sessionId);

    res.json({
      sessionId,
      outroPath
    });
  } catch (err) {
    console.error('Error in /outro:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
