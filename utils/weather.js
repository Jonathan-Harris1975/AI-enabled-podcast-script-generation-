// utils/weather.js
import fetch from 'node-fetch';

const getWeatherSummary = async (date) => {
  try {
    // Replace with your actual weather API endpoint & key
    const apiKey = process.env.WEATHER_API_KEY;
    const location = 'London,UK';
    const response = await fetch(
      `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${location}&dt=${date}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Build a simple summary
    const condition = data.forecast.forecastday[0].day.condition.text;
    const temp = data.forecast.forecastday[0].day.avgtemp_c;

    return `Weather in ${location} on ${date}: ${condition}, around ${temp}°C.`;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return 'Unable to fetch weather data right now.';
  }
};

export default getWeatherSummary;
