import { formatDistanceToNow } from 'date-fns';

/** Display UTC ISO string in the user's local timezone — full date + time */
export function formatLocalDateTime(utcString: string): string {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Date only in user's local timezone */
export function formatLocalDate(utcString: string): string {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/** Time only in user's local timezone */
export function formatLocalTime(utcString: string): string {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Relative time e.g. "2 hours ago", "in 3 days" */
export function formatRelativeTime(utcString: string): string {
  if (!utcString) return '';
  const date = new Date(utcString);
  if (Number.isNaN(date.getTime())) return '';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getTimeZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

export function isUpcoming(utcString: string): boolean {
  if (!utcString) return false;
  const t = new Date(utcString).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

export function isPast(utcString: string): boolean {
  if (!utcString) return false;
  const t = new Date(utcString).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

/**
 * Converts `<input type="datetime-local" />` value (interpreted as user's local time)
 * to a UTC ISO string for Supabase.
 */
export function localDateTimeInputToUtcIso(localValue: string): string | undefined {
  if (!localValue || !localValue.trim()) return undefined;
  const ms = new Date(localValue).getTime();
  if (Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString();
}

/** Today's calendar date in the user's local timezone (YYYY-MM-DD). For daily keys / free votes. */
export function getLocalCalendarDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
