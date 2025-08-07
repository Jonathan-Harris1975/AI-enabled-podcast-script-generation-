const generateCta = (book) => {
  if (!book || !book.slug) {
    return `Want more? Head to jonathan-harris.online for the full ebook collection, sharp AI updates, and the newsletter sign-up.`;
  }

  return `Curious to dive deeper into "${book.slug}"? Head over to https://books.jonathan-harris.online/${book.slug} — you'll find the full ebook collection, AI updates, and the newsletter signup. No spam, just sharp insights.`;
};

export default generateCta;
