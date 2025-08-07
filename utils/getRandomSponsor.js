import fs from 'fs';
import path from 'path';

let booksCache = null;

export default function getRandomSponsor() {
  if (!booksCache) {
    const booksPath = path.resolve('data', 'books.json');
    const raw = fs.readFileSync(booksPath, 'utf-8');
    booksCache = JSON.parse(raw);
  }

  const keys = Object.keys(booksCache);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  return {
    title: randomKey,
    url: booksCache[randomKey]
  };
}
