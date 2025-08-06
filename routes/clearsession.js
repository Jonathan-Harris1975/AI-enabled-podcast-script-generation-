import express from 'express';
import { clearSession } from '../utils/memoryCache.js';

const router = express.Router();

/**
 * @route POST /clear-session
 * @desc Clears cached content for a given sessionId
 * @body { "sessionId": "abc123" }
 */
router.post('/clear-session', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  clearSession(sessionId);
  res.json({ message: `Session ${sessionId} cleared from cache` });
});

export default router;
