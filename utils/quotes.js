// /src/utils/quotes.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quotesFile = path.join(__dirname, 'quotes.txt');

// Read all quotes into an array (one per line, ignoring empty lines)
const quotes = fs
  .readFileSync(quotesFile, 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

export default quotes;
