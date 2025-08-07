import fs from 'fs';

const rawData = fs.readFileSync(new URL('./books.json', import.meta.url));
const books = JSON.parse(rawData);

export default function getRandomBook() {
  const index = Math.floor(Math.random() * books.length);
  return books[index];
}
