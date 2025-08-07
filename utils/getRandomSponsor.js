import books from '../data/books.json' assert { type: 'json' };

export default function getRandomSponsor() {
  const i = Math.floor(Math.random() * books.length);
  const { title, shortUrl } = books[i];
  return { title, shortUrl };
}
