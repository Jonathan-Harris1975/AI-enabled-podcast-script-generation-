import express from 'express';
import { getIntroPrompt } from '../utils/promptTemplates.js';
// V-- THE FIX IS HERE --V
import getTuringQuote from '../utils/getTuringQuote.js'; // Corrected: removed curly braces for default import
import getRealWeatherSummary from '../utils/weather.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    console.log("Handling /intro request...");

    const weatherSummary = await getRealWeatherSummary("London");
    console.log(`Fetched weather: "${weatherSummary}"`);

    const turingQuote = getTuringQuote();

    const prompt = getIntroPrompt({ weatherSummary, turingQuote });

    res.json({ prompt });

  } catch (error) {
    console.error("Error in /intro route:", error);
    next(error);
  }
});

export default router;
