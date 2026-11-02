/**
 * Canonicalizes an email address to prevent duplicate waitlist submissions
 * using dot/plus tricks (e.g. Gmail dots and +tags).
 *
 * Rules:
 * - Trim and lowercase.
 * - Split into local part and domain.
 * - For gmail.com and googlemail.com:
 *   - Remove all dots in the local part.
 *   - Drop everything after "+".
 *   - Normalize the domain to "gmail.com".
 * - For every other domain:
 *   - Drop everything after "+" (tag).
 *   - Keep dots in the local part.
 */
export function canonicalEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) return trimmed;

  let localPart = trimmed.slice(0, atIndex);
  let domain = trimmed.slice(atIndex + 1);

  // Drop everything after "+" in local part
  const plusIndex = localPart.indexOf('+');
  if (plusIndex !== -1) {
    localPart = localPart.slice(0, plusIndex);
  }

  // Gmail / Googlemail normalization
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    localPart = localPart.replace(/\./g, '');
    domain = 'gmail.com';
  }

  return `${localPart}@${domain}`;
}
