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
