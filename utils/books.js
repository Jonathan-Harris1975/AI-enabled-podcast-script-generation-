import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let books;
try {
  books = require('../data/books.json');
} catch (err) {
  console.error('Failed to load books.json', err);
  books = []; // Fallback empty array
}

export default function getRandomSponsor() {
  if (books.length === 0) return null;
  const i = Math.floor(Math.random() * books.length);
  return books[i];
}
