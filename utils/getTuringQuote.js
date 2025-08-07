const turingQuotes = [
  "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.",
  "We can only see a short distance ahead, but we can see plenty there that needs to be done.",
  "A computer would deserve to be called intelligent if it could deceive a human into believing that it was human.",
  "Those who can imagine anything, can create the impossible.",
  "Machines take me by surprise with great frequency.",
  "I propose to consider the question, 'Can machines think?'"
];

export default function getTuringQuote() {
  const i = Math.floor(Math.random() * turingQuotes.length);
  return turingQuotes[i];
}
