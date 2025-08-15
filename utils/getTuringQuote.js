const fs = require('fs');
const path = require('path');

let quotesCache = null;

function getTuringQuote() {
  if (!quotesCache) {
    const quotesPath = path.resolve('utils', 'quotes.txt');
    const raw = fs.readFileSync(quotesPath, 'utf-8');
    quotesCache = raw
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  const i = Math.floor(Math.random() * quotesCache.length);
  return quotesCache[i];
}

module.exports = getTuringQuote;
