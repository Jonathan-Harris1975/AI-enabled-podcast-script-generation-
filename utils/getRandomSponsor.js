import fs from 'fs';
import path from 'path';

export default function getRandomSponsor() {
  const filePath = path.resolve('data/books.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const books = JSON.parse(rawData);

  const i = Math.floor(Math.random() * books.length);
  return books[i]; // Includes both title and shortUrl
}
