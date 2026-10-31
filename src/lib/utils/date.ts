// Date & Timezone utilities for Asia/Kolkata (IST)

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Kolkata
 */
export function getTodayIST(): string {
  return getDateKeyIST(new Date());
}

/**
 * Format any Date into YYYY-MM-DD in Asia/Kolkata
 */
export function getDateKeyIST(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // en-CA gives YYYY-MM-DD
}

/**
 * Returns the Monday of the week for a given date in Asia/Kolkata (YYYY-MM-DD)
 */
export function getWeekStartIST(date: Date): string {
  // Convert date to IST parts
  const parts = getISTParts(date);
  const istDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayOfWeek = istDate.getUTCDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  istDate.setUTCDate(istDate.getUTCDate() + diffToMonday);
  return istDate.toISOString().slice(0, 10);
}

/**
 * Returns month bucket YYYY-MM in Asia/Kolkata
 */
export function getMonthKeyIST(date: Date): string {
  const parts = getISTParts(date);
  const m = String(parts.month).padStart(2, '0');
  return `${parts.year}-${m}`;
}

export function getISTParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const findPart = (name: string) => {
    const val = parts.find((p) => p.type === name)?.value;
    return val ? parseInt(val, 10) : 0;
  };
  return {
    year: findPart('year'),
    month: findPart('month'),
    day: findPart('day'),
    hour: findPart('hour') === 24 ? 0 : findPart('hour'),
    minute: findPart('minute'),
  };
}

/**
 * Formats date for display: "Oct 30, 2026 - 10:42 AM"
 */
export function formatDisplayIST(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(',', '') + ' IST';
}

/**
 * Parse YYYY-MM-DD in IST into UTC Date at start of day (00:00:00 IST)
 */
export function parseISTStartOfDay(dateStr: string): Date {
  // IST is UTC+5:30 -> 00:00:00 IST = previous day 18:30:00 UTC
  return new Date(`${dateStr}T00:00:00+05:30`);
}

/**
 * Parse YYYY-MM-DD in IST into UTC Date at end of day (23:59:59.999 IST)
 */
export function parseISTEndOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}
