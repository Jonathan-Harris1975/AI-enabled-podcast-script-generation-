// utils/books.js
import books from './books.json' assert { type: 'json' };

export default function getRandomBook() {
  const index = Math.floor(Math.random() * books.length);
  return books[index];
}
