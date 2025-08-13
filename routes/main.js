import express from 'express';
import generateChunksPath from '../utils/generateChunksPath.js'; // you'll need this util

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { rsFeed, sessionId } = req.body;

    if (!rsFeed || !sessionId) {
      return res.status(400).json({ error: 'Missing rsFeed or sessionId' });
    }

    // Generate chunk paths from util — replace with your actual logic
    const chunksPath = await generateChunksPath(rsFeed, sessionId);

    res.json({
      sessionId,
      chunksPath
    });
  } catch (err) {
    console.error('Error in /main:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
