const express = require('express');
const router = express.Router();
const { storeSection } = require('../utils/memoryCache');

router.post('/intro', async (req, res) => {
  const { sessionId, date, ...rest } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const content = `Generated intro for date ${date || 'N/A'}`;
    storeSection(sessionId, 'intro', content);
    res.json({ sessionId, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate intro' });
  }
});

module.exports = router;
