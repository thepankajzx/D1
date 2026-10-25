/**
 * D1 Security: Input Sanitization & XSS Prevention
 * Ensures all user-supplied text fields (habit names, notes, units)
 * are sanitized before saving to Firestore or local storage.
 */

export function sanitizeText(input, maxLength = 200) {
  if (typeof input !== 'string') return '';
  
  // 1. Strip script and style blocks completely (including content)
  let clean = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '') // remove remaining HTML tags
    .replace(/javascript:/gi, '') // remove javascript: URI scheme
    .replace(/data:/gi, '') // remove data: URI scheme
    .replace(/[^\w\s\u0900-\u097F.,!?'"()#@\-:;%/+=]/gi, '') // allow alphanumeric, unicode/hindi, standard punctuation
    .trim();

  // 2. Enforce length limits
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength).trim();
  }

  return clean;
}

export function sanitizeHabit(habit) {
  if (!habit || typeof habit !== 'object') return habit;

  return {
    ...habit,
    name: sanitizeText(habit.name || '', 80),
    description: sanitizeText(habit.description || '', 250),
    notes: sanitizeText(habit.notes || '', 1000),
    unit: sanitizeText(habit.unit || '', 20)
  };
}
