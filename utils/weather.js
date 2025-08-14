/**
 * Fetches weather data for a given city.
 * This function is meant to be called from your front-end code.
 * It calls our own secure backend function (/api/getWeather)
 * instead of the external RapidAPI service.
 *
 * @param {string} city - The city for the forecast (e.g., "London").
 * @returns {Promise<object>} A promise that resolves with the weather data.
 * @throws {Error} If the city is missing or the API call fails.
 */
export default async function getWeatherData(city) {
  if (!city) {
    throw new Error("City cannot be empty.");
  }

  // This URL points to the backend function from Part 1.
  const response = await fetch(`/api/getWeather?city=${city}`);
  const data = await response.json();

  // If our backend returned an error, we throw it so the UI can catch it.
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}
