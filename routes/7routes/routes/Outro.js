const express = require('express');
const router = express.Router();
const { storeSection } = require('../utils/memoryCache');

router.post('/outro', async (req, res) => {
  const { sessionId, date, ...rest } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const content = `Generated outro for date ${date || 'N/A'}`;
    storeSection(sessionId, 'outro', content);
    res.json({ sessionId, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate outro' });
  }
});

module.exports = router;
