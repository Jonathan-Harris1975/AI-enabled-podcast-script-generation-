export default function editAndFormat(text) {
  return text
    .replace(/\s{2,}/g, ' ')        // collapse extra spaces
    .replace(/([.!?])(?=[^\s])/g, '$1 ') // ensure space after punctuation
    .replace(/“|”/g, '"')           // replace smart quotes with straight quotes
    .replace(/‘|’/g, "'")           // replace smart apostrophes
    .trim();
}
