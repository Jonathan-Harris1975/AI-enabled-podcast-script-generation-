import express from 'express';
import { getIntroPrompt } from '../utils/promptTemplates.js';
import { getTuringQuote } from '../utils/turingQuotes.js'; // Assuming this file exists
import getRealWeatherSummary from '../utils/weather.js'; // <-- IMPORT THE NEW FUNCTION

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    console.log("Handling /intro request...");

    // 1. Fetch the REAL weather summary from the API.
    //    This is an async call, so we use await.
    const weatherSummary = await getRealWeatherSummary("London");
    console.log(`Fetched weather: "${weatherSummary}"`);

    // 2. Get the Turing quote (assuming this is synchronous).
    const turingQuote = getTuringQuote();

    // 3. Generate the intro prompt using the real weather data.
    const prompt = getIntroPrompt({ weatherSummary, turingQuote });

    // 4. Send the generated prompt back as the response.
    res.json({ prompt });

  } catch (error) {
    // Pass any errors to the global error handler in index.js
    console.error("Error in /intro route:", error);
    next(error);
  }
});

export default router;
