'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './theme-script';

/**
 * Color theme. The choice lives in localStorage and is applied as
 * `<html data-theme>`; tokens.css swaps the semantic tokens from there.
 * `themeScript` (lib/theme-script.ts) applies it before first paint —
 * keep its fallback in sync with `resolve()`.
 */

export type Theme = 'light' | 'dark';


const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Saved choice, or the OS setting when nothing is saved yet. */
function resolve(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // storage blocked → fall back to the OS setting
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((l) => l());
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // still switch for this visit
  }
  apply(theme);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) apply(resolve());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, current, () => 'light');
}

/**
 * Re-applies the theme after React's dev Strict Mode remount clears the
 * attribute the inline script set on <html>. A no-op in production.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    const theme = resolve();
    if (current() !== theme) apply(theme);
  }, []);
  return null;
}
