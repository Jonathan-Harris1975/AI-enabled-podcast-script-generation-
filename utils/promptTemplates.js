import fs from 'fs';
import path from 'path';

// Load books.json to inject sponsors in outro
const booksPath = path.join(process.cwd(), 'utils', 'books.json');
const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

function getRandomBook() {
  return books[Math.floor(Math.random() * books.length)];
}

export const introPrompt = `
Write a podcast introduction in a laid-back, Gen X style — think dry humor, a dash of 90s nostalgia, and zero corporate fluff.
Set the tone like you're chatting with friends over coffee, not reading off a teleprompter.
No episode numbers or titles, just vibe and welcome the listener.
`;

export const mainPrompt = `
Summarise the following AI and tech news items in a sarcastic, Gen X voice — a mix of pop culture references, skepticism, and clever one-liners.
Avoid sounding like a press release.
Imagine you're explaining it to a friend who still remembers cassette tapes.
`;

export function outroPromptWithSponsor() {
  const book = getRandomBook();
  return `
Write a podcast outro in a dry, witty, Gen X tone — a little self-aware, maybe a cheeky pop culture reference or two.
Thank the listeners without being cheesy, then work in this sponsor organically:
"${book.title}" — find it here: ${book.url}
Keep it short, friendly, and memorable.
`;
}
