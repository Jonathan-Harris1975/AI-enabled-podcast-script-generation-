// utils/sanitize.js
export function sanitizeText(text = '') {
  return String(text)
    .replace(/[\r\n\t]+/g, ' ')  // Remove all line breaks/tabs
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .replace(/["“”]/g, '')       // Strip all types of quotation marks
    .replace(/[\[\]{}]/g, '')    // Remove any brackets or braces
    .trim();                     // Trim leading/trailing whitespace
}
