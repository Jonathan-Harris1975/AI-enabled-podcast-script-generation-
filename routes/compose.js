import express from 'express';
import composePodcast from '../utils/composePodcast.js'; // util that builds all required fields

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    // Compose all outputs from util
    const {
      transcriptUrl,
      chunkUrls,
      chunks,
      fullTranscript,
      podcast,
      episodeNumber
    } = await composePodcast(sessionId);

    res.json({
      sessionId,
      transcriptUrl,
      chunkUrls,
      chunks,
      fullTranscript,
      podcast: {
        title: podcast.title,
        description: podcast.description,
        seoKeywords: podcast.seoKeywords,
        artworkPrompt: podcast.artworkPrompt
      },
      episodeNumber
    });
  } catch (err) {
    console.error('Error in /compose:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
