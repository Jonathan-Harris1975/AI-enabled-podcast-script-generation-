const express = require('express');
const router = express.Router();
const { getSection } = require('../utils/memoryCache');

router.post('/compose', async (req, res) => {
  const { sessionId, intro, main, outro, date } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const finalIntro = intro || getSection(sessionId, 'intro');
  const finalMain = main || getSection(sessionId, 'main');
  const finalOutro = outro || getSection(sessionId, 'outro');

  if (!finalIntro || !finalMain || !finalOutro) {
    return res.status(400).json({
      error: 'Missing one or more sections and not found in cache'
    });
  }

  try {
    const script = `${finalIntro}\n\n${finalMain}\n\n${finalOutro}`;
    const metadata = { length: script.length, date: date || new Date().toISOString() };
    const tts = `TTS audio for script: ${script}`;
    const transcript = script;

    res.json({
      sessionId,
      script,
      metadata,
      tts,
      transcript
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compose script' });
  }
});

module.exports = router;
