const express = require('express');
const router = express.Router();
const { clearSession } = require('../utils/memoryCache');

router.post('/clear-session', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  clearSession(sessionId);
  res.json({ message: `Session ${sessionId} cleared from cache` });
});

module.exports = router;
