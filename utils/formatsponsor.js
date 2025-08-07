// utils/formatSponsor.js

/**
 * Formats sponsor book info into a clean string.
 * Returns fallback if any data is missing.
 * @param {Object} book
 * @param {string} book.title
 * @param {string} book.author
 * @param {string} book.link
 * @returns {string}
 */
export function formatSponsor(book) {
  if (!book?.title || !book?.author || !book?.link) {
    return 'a brilliant AI book (details mysteriously missing)';
  }

  return `${book.title} by ${book.author} – ${book.link}`;
}
