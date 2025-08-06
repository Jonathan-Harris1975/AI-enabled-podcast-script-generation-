const express = require('express');
const router = express.Router();
const { storeSection } = require('../utils/memoryCache');

router.post('/main', async (req, res) => {
  const { sessionId, date, ...rest } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    const content = `Generated main section for date ${date || 'N/A'}`;
    storeSection(sessionId, 'main', content);
    res.json({ sessionId, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate main section' });
  }
});

module.exports = router;
