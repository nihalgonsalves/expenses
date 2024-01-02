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

type CSSColor =
  | `hsl(${number}, ${number}%, ${number}%)`
  | `hsla(${number}, ${number}%, ${number}%, ${number})`
  | `#${string}`;

export type ThemeColors = {
  primary: CSSColor;
  background: CSSColor;
  primaryStroke?: CSSColor;
  backgroundStroke?: CSSColor;
};

export const themeColors = {
  blue: {
    primary: 'hsl(201, 100%, 46%)',
    background: 'hsl(222.2, 84%, 4.9%)',
    primaryStroke: '#000',
    backgroundStroke: 'hsl(201, 100%, 46%)',
  },
  slate: {
    primary: 'hsl(210, 40%, 98%)',
    background: 'hsl(222.2, 84%, 4.9%)',
  },
  rose: {
    primary: 'hsl(346.8, 77.2%, 49.8%)',
    background: 'hsl(20, 14.3%, 4.1%)',
    primaryStroke: 'hsla(0, 0%, 100%, 0.9)',
    backgroundStroke: 'hsla(0, 0%, 100%, 0.9)',
  },
  green: {
    primary: 'hsl(142.1, 70.6%, 45.3%)',
    background: 'hsl(20, 14.3%, 4.1%)',
  },
  orange: {
    primary: 'hsl(20.5, 90.2%, 48.2%)',
    background: 'hsl(20, 14.3%, 4.1%)',
  },
  yellow: {
    primary: 'hsl(47.9, 95.8%, 53.1%)',
    background: 'hsl(20, 14.3%, 4.1%)',
  },
  violet: {
    primary: 'hsl(263.4, 70%, 50.4%)',
    background: 'hsl(224, 71.4%, 4.1%)',
    primaryStroke: 'hsla(0, 0%, 100%, 0.9)',
    backgroundStroke: 'hsla(0, 0%, 100%, 0.9)',
  },
} satisfies Record<Theme, ThemeColors>;

export const THEME_DEFAULT = 'blue';

export const ZTheme = z.enum(THEMES);

export type Theme = z.infer<typeof ZTheme>;
