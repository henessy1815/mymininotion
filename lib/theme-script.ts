/**
 * Shared by lib/theme.ts and the pre-paint script in app/layout.tsx.
 * Not a 'use client' module, so the server layout can inline the script.
 */

export const THEME_STORAGE_KEY = 'mini-notion:theme';

/** Applies the saved theme (or the OS setting) before first paint, so there is no light flash. */
export const themeScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
