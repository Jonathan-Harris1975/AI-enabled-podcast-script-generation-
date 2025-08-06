import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM helpers for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your quotes.txt
const quotesPath = path.join(__dirname, 'quotes.txt');

// Read and split quotes by line
const quotes = fs.readFileSync(quotesPath, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

export default quotes;
