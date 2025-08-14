/**
 * Fetches real weather data from the RapidAPI service.
 * This function is designed to run on the server-side (e.g., in a Node.js script)
 * where it can securely access environment variables.
 *
 * @param {string} city - The city to get the weather for (e.g., "London").
 * @returns {Promise<string>} A promise that resolves to a human-readable weather summary string.
 */
export default async function getRealWeatherSummary(city) {
  // 1. Securely access the environment variables from Render.
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  // 2. Validate that the server is configured correctly.
  if (!apiKey || !apiHost) {
    console.error("Error: Weather API credentials (RAPIDAPI_KEY, RAPIDAPI_HOST) are not set in the environment.");
    // Return a safe, generic fallback summary.
    return "The weather is, as ever, a topic of conversation.";
  }

  // 3. Construct the URL and options for the RapidAPI call.
  const url = `https://${apiHost}/forecast.json?q=${city}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost,
    },
  };

  // 4. Make the API call and handle the response.
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      // Log the error from the API for debugging but return a fallback.
      console.error("RapidAPI Error:", data.error ? data.error.message : 'Unknown API error');
      return "The weather forecast is currently unavailable.";
    }
    
    // 5. On success, extract the relevant info and return a summary string.
    const condition = data.forecast.forecastday[0].day.condition.text;
    return `It’s currently ${condition.toLowerCase()} in London.`;

  } catch (error) {
    console.error("Failed to fetch weather data:", error);
    return "The weather forecast seems to be offline at the moment.";
  }
  }
