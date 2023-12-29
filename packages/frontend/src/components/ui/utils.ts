import clsx, { type ClassValue } from 'clsx';
import { createTwc } from 'react-twc';
import { twMerge } from 'tailwind-merge';

export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));

export const twx = createTwc({ compose: cn });
