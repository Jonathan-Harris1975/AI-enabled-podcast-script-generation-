import fetch from 'node-fetch';

export async function getWeatherSummary(dateStr) {
  try {
    const response = await fetch(`https://api.weatherapi.com/v1/history.json?key=${process.env.WEATHER_API_KEY}&q=London&dt=${dateStr}`);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    const data = await response.json();

    const forecast = data.forecast?.forecastday?.[0]?.day;
    if (!forecast) return 'Weather data unavailable.';

    return `Weather in London on ${dateStr}: ${forecast.condition.text}, avg temp ${forecast.avgtemp_c}°C.`;
  } catch (err) {
    console.error('Weather fetch failed:', err.message);
    return 'Weather data unavailable.';
  }
}
