// utils/weather.js
const sampleSummaries = [
  "A crisp, clear day with bright ideas brewing.",
  "Stormy in the cloud — both weather and computing.",
  "Sunny skies, perfect for forecasting machine learning models.",
  "Overcast but optimistic — like a neural net in training."
];

export default function getWeatherSummary(date) {
  // Simple random selection for placeholder effect
  const index = Math.floor(Math.random() * sampleSummaries.length);
  return sampleSummaries[index];
}
