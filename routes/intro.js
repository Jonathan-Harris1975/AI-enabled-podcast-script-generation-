import express from 'express';
import getInfoPath from '../utils/getInfoPath.js'; // you'll need this util or similar

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, date } = req.body;

    if (!sessionId || !date) {
      return res.status(400).json({ error: 'Missing sessionId or date' });
    }

    // Get infoPath from util — replace with your actual util function
    const infoPath = await getInfoPath(sessionId, date);

    res.json({
      sessionId,
      infoPath
    });
  } catch (err) {
    console.error('Error in /intro:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
