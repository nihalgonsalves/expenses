import { z } from 'zod';

export const THEMES = [
  'blue',
  'slate',
  'rose',
  'orange',
  'green',
  'yellow',
  'violet',
] as const;

export const THEME_DEFAULT = 'blue';

export const ZTheme = z.enum(THEMES);

export type Theme = z.infer<typeof ZTheme>;
