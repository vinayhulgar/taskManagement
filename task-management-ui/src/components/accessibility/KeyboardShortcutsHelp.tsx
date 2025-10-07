import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAccessibilityContext } from '@/contexts/AccessibilityContext';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { keyboardShortcuts } = useAccessibilityContext();

  // Add shortcut to open help
  useKeyboardNavigation([
    {
      key: '?',
      shiftKey: true,
      action: () => setIsOpen(true),
      description: 'Show keyboard shortcuts help'
    }
  ]);

  const formatShortcut = (shortcut: typeof keyboardShortcuts[0]) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.metaKey) keys.push('Cmd');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' + ');
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        aria-label="Show keyboard shortcuts help"
        className="fixed bottom-4 right-4 z-40"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="sr-only">Keyboard shortcuts help</span>
      </Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Keyboard Shortcuts"
        description="Available keyboard shortcuts for faster navigation"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            {keyboardShortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
            
            {/* Additional shortcuts */}
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show this help
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                Shift + ?
              </kbd>
            </div>
            
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Close modal/dialog
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                Escape
              </kbd>
            </div>
            
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Navigate between elements
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                Tab / Shift + Tab
              </kbd>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};