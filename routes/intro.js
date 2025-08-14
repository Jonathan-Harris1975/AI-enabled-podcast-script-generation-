import express from 'express';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { sessionId, date } = req.body;

    if (!sessionId || !date) {
      return res.status(400).json({ error: 'Missing sessionId or date' });
    }

    // Example weather API call (replace with your real endpoint/key)
    const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=env.RAPIDAPI_KEY&q=London&dt=${date}`;
    const weatherResponse = await fetch(weatherApiUrl);
    const weatherData = await weatherResponse.json();

    // Create intro text based on weather data
    const introText = `Welcome to our podcast for ${date}. Today’s weather in London: ${weatherData.forecast.forecastday[0].day.condition.text}, ${weatherData.forecast.forecastday[0].day.avgtemp_c}°C.`;

    // Save to persistent disk
    const sessionDir = path.resolve('/mnt/data', sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    fs.writeFileSync(path.join(sessionDir, 'intro.txt'), introText, 'utf-8');

    res.json({
      status: 'success',
      file: `/mnt/data/${sessionId}/intro.txt`
    });
  } catch (error) {
    console.error('Error generating intro:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;
