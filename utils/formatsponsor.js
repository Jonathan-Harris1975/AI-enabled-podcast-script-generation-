// utils/formatSponsor.js

export function formatSponsor(book) {
  if (!book?.title || !book?.author || !book?.link) {
    return 'a brilliant AI book (details mysteriously missing)';
  }

  return `${book.title} by ${book.author} – ${book.link}`;
}
