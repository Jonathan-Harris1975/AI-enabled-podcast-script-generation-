// In your main route handler:

router.post('/', async (req, res) => {
  try {
    const { rssFeedUrl, sessionId } = req.body;

    if (!rssFeedUrl || !sessionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const articles = await fetchFeeds(rssFeedUrl, { maxAgeDays: 7, limit: 10 }); // keep it manageable

    const chunks = [];

    for (let i = 0; i < articles.length; i++) {
      const prompt = getSingleStoryPrompt(`${articles[i].title} - ${articles[i].summary}`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.75,
        messages: [{ role: 'user', content: prompt }]
      });

      const chunk = completion.choices[0].message.content.trim();

      if (chunk.length < 3000) {
        // Optionally, regenerate with a prompt to add more detail or commentary
        // Or accept as is if you want to avoid infinite loops
      } else if (chunk.length > 4000) {
        // Optionally truncate or ask for a shorter rewrite
      }

      chunks.push(chunk);
    }

    if (chunks.length === 0) {
      throw new Error('No chunks generated.');
    }

    // Save chunks etc as before...

    // Respond
    res.json({ sessionId, chunkPaths: [] }); // your file saving logic here

  } catch (err) {
    console.error('❌ Main route error:', err);
    res.status(500).json({ error: 'Podcast generation failed', details: err.message });
  }
});    // Ensure each chunk is between 2000–4000 characters
    chunks = chunks.filter(chunk => {
      const len = chunk.length;
      return len >= 500 && len <= 5000;
    });

    if (chunks.length === 0) {
      throw new Error('No chunks met the character length requirement (500-4000 characters).');
    }

    const storageDir = path.resolve('/mnt/data', sessionId);
    fs.mkdirSync(storageDir, { recursive: true });

    chunks.forEach((chunk, i) => {
      const filePath = path.join(storageDir, `raw-chunk-${i + 1}.txt`);
      fs.writeFileSync(filePath, chunk);
    });

    await saveToMemory(sessionId, 'mainChunks', chunks);

    const chunkPaths = chunks.map((_, i) => `/mnt/data/${sessionId}/raw-chunk-${i + 1}.txt`);

    res.json({
      sessionId,
      chunkPaths
    });

  } catch (err) {
    console.error('❌ Main route error:', err);
    res.status(500).json({ error: 'Podcast generation failed', details: err.message });
  }
});

export default router;
