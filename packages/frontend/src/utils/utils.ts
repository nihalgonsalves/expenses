import { Temporal } from '@js-temporal/polyfill';

export const getUserLanguage = () => {
  return window.navigator.languages[0];
};

export const generateId = () => {
  const bytes = new Uint8Array(36);
  globalThis.crypto.getRandomValues(bytes);

  const binString = Array.from(bytes, (x) => String.fromCodePoint(x)).join('');

  return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_');
};

// simply check for anything@anything.anytld
export const prevalidateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const dateTimeLocalToISOString = (val: string) =>
  Temporal.PlainDateTime.from(val)
    .toZonedDateTime(Intl.DateTimeFormat().resolvedOptions().timeZone)
    .toString();

export const formatDateTime = (iso8601: string) =>
  new Intl.DateTimeFormat(getUserLanguage(), {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(Temporal.Instant.from(iso8601).epochMilliseconds);

export const getInitials = (name: string): string => {
  const [first, last] = name.split(' ');

  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
};

export const getShortName = (name: string): string => name.split(' ')[0] ?? '';

export const joinList = (list: string[]): string => {
  if (list.length === 0) {
    return '';
  }

  if (list.length === 1) {
    return list[0] ?? '';
  }

  if (list.length === 2) {
    return `${list[0]} & ${list[1]}`;
  }

  return `${list.slice(0, -1).join(', ')} & ${list.at(-1)}`;
};
