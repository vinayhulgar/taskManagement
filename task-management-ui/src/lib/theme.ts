// Theme utilities and management

import type { Theme } from '@/types';
import { STORAGE_KEYS } from './constants';

/**
 * Gets the system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Gets the stored theme preference
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored as Theme;
  }
  return null;
}

/**
 * Stores the theme preference
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

/**
 * Resolves the actual theme to apply based on preference and system theme
 */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Applies the theme to the document
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Sets up a system theme change listener
 */
export function setupSystemThemeListener(callback: (theme: 'light' | 'dark') => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

/**
 * Gets the initial theme on app startup
 */
export function getInitialTheme(): Theme {
  const stored = getStoredTheme();
  if (stored) return stored;
  
  // Default to system theme if no preference is stored
  return 'system';
}

/**
 * Theme configuration object
 */
export const themeConfig = {
  themes: ['light', 'dark', 'system'] as const,
  defaultTheme: 'system' as Theme,
  storageKey: STORAGE_KEYS.THEME,
  
  // CSS custom properties for theme colors
  cssVariables: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '222.2 84% 4.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '222.2 84% 4.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222.2 84% 4.9%',
      '--primary': '221.2 83.2% 53.3%',
      '--primary-foreground': '210 40% 98%',
      '--secondary': '210 40% 96%',
      '--secondary-foreground': '222.2 84% 4.9%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '215.4 16.3% 46.9%',
      '--accent': '210 40% 96%',
      '--accent-foreground': '222.2 84% 4.9%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '214.3 31.8% 91.4%',
      '--input': '214.3 31.8% 91.4%',
      '--ring': '221.2 83.2% 53.3%',
    },
    dark: {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '222.2 84% 4.9%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--ring': '224.3 76.3% 94.1%',
    },
  },
} as const;

/**
 * Applies CSS custom properties for the given theme
 */
export function applyCSSVariables(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const variables = themeConfig.cssVariables[theme];
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

/**
 * Complete theme application (classes + CSS variables)
 */
export function applyCompleteTheme(theme: 'light' | 'dark'): void {
  applyTheme(theme);
  applyCSSVariables(theme);
}

/**
 * Theme utility class for managing theme state
 */
export class ThemeManager {
  private theme: Theme;
  private resolvedTheme: 'light' | 'dark';
  private systemThemeListener?: () => void;
  private callbacks: Set<(theme: 'light' | 'dark') => void> = new Set();

  constructor(initialTheme?: Theme) {
    this.theme = initialTheme || getInitialTheme();
    this.resolvedTheme = resolveTheme(this.theme);
    this.setupSystemListener();
    this.applyTheme();
  }

  private setupSystemListener(): void {
    if (this.theme === 'system') {
      this.systemThemeListener = setupSystemThemeListener(systemTheme => {
        this.resolvedTheme = systemTheme;
        this.applyTheme();
        this.notifyCallbacks();
      });
    }
  }

  private applyTheme(): void {
    applyCompleteTheme(this.resolvedTheme);
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.resolvedTheme));
  }

  public setTheme(theme: Theme): void {
    // Clean up previous system listener
    if (this.systemThemeListener) {
      this.systemThemeListener();
      this.systemThemeListener = undefined;
    }

    this.theme = theme;
    this.resolvedTheme = resolveTheme(theme);
    setStoredTheme(theme);

    // Set up new system listener if needed
    this.setupSystemListener();
    
    this.applyTheme();
    this.notifyCallbacks();
  }

  public getTheme(): Theme {
    return this.theme;
  }

  public getResolvedTheme(): 'light' | 'dark' {
    return this.resolvedTheme;
  }

  public subscribe(callback: (theme: 'light' | 'dark') => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public destroy(): void {
    if (this.systemThemeListener) {
      this.systemThemeListener();
    }
    this.callbacks.clear();
  }
}

// Export a default theme manager instance
export const themeManager = new ThemeManager();