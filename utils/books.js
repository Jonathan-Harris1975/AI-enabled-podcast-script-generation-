// utils/books.js
export default async function getRandomBook() {
  const booksModule = await import('./books.json', {
    assert: { type: 'json' }
  });

  const books = booksModule.default;
  const index = Math.floor(Math.random() * books.length);
  return books[index];
}
