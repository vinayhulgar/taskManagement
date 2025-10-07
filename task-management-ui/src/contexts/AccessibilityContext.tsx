import React, { createContext, useContext, useEffect, useState } from 'react';
import { useScreenReader, useHighContrast, useReducedMotion, useLiveRegion } from '@/hooks/useAccessibility';
import { useGlobalKeyboardShortcuts } from '@/hooks/useKeyboardNavigation';

interface AccessibilityContextType {
  isHighContrast: boolean;
  prefersReducedMotion: boolean;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceToLiveRegion: (message: string) => void;
  keyboardShortcuts: Array<{
    key: string;
    description: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  }>;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { announce } = useScreenReader();
  const { announce: announceToLiveRegion } = useLiveRegion();
  const isHighContrast = useHighContrast();
  const prefersReducedMotion = useReducedMotion();
  const keyboardShortcuts = useGlobalKeyboardShortcuts();

  // Apply accessibility classes to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (prefersReducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [isHighContrast, prefersReducedMotion]);

  const value: AccessibilityContextType = {
    isHighContrast,
    prefersReducedMotion,
    announce,
    announceToLiveRegion,
    keyboardShortcuts: keyboardShortcuts.map(shortcut => ({
      key: shortcut.key,
      description: shortcut.description,
      ctrlKey: shortcut.ctrlKey,
      metaKey: shortcut.metaKey,
      shiftKey: shortcut.shiftKey,
      altKey: shortcut.altKey,
    })),
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};