// This is a Node.js serverless function. It runs on Render's backend.
// It is NOT the same as your utils/weather.js file.

export default async function handler(request, response) {
  // 1. Securely access environment variables on the server.
  const apiKey = process.env.RAPIDAPI_KEY;
  const apiHost = process.env.RAPIDAPI_HOST;

  // 2. Get the city from the request URL (e.g., /api/getWeather?city=London).
  const { city } = request.query;

  // 3. Validate the inputs.
  if (!apiKey || !apiHost) {
    return response.status(500).json({ error: "Server is not configured with API credentials." });
  }
  if (!city) {
    return response.status(400).json({ error: "A 'city' parameter is required." });
  }

  // 4. Construct the real API call to RapidAPI.
  const url = `https://${apiHost}/forecast.json?q=${city}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': apiHost,
    },
  };

  // 5. Execute the call and return the result to the front-end.
  try {
    const fetchResponse = await fetch(url, options);
    const data = await fetchResponse.json();
    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).json({ error: data.message || 'API request failed.' });
    }
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ error: `Internal error: ${error.message}` });
  }
}
