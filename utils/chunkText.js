export default function chunkText(text, maxLength = 4500) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxLength;
    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // Try to break at a sentence boundary
    let breakpoint = text.lastIndexOf('.', end);
    if (breakpoint === -1 || breakpoint <= start + 200) {
      // If no suitable '.', try newline
      breakpoint = text.lastIndexOf('\n', end);
    }
    if (breakpoint === -1 || breakpoint <= start + 200) {
      // Otherwise break at word
      breakpoint = text.lastIndexOf(' ', end);
    }

    if (breakpoint === -1 || breakpoint <= start) {
      // Emergency: hard cut
      breakpoint = end;
    }

    chunks.push(text.slice(start, breakpoint + 1).trim());
    start = breakpoint + 1;
  }

  return chunks;
}
