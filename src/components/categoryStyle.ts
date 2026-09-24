import type { Category } from '../data/types';
import type { CSSProperties } from 'react';

/** Accent colour per category. Used sparingly: labels, glows and placeholders. */
export const CATEGORY_ACCENT: Record<Category, string> = {
  arms: '#a78bfa',
  legs: '#38bdf8',
  upper: '#818cf8',
  lower: '#2dd4bf',
  booty: '#f472b6',
  abs: '#a3e635',
  full: '#fb923c',
};

/** Sets `--accent` so children can use `text-(--accent)` etc. */
export const accentVars = (c: Category) => ({ '--accent': CATEGORY_ACCENT[c] }) as CSSProperties;
