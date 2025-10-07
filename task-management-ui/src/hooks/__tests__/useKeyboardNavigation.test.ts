import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboardNavigation, useGlobalKeyboardShortcuts } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  it('registers keyboard shortcuts', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction,
        description: 'Test shortcut'
      }
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    // Simulate Ctrl+K keypress
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true
    });
    
    act(() => {
      document.dispatchEvent(event);
    });

    expect(mockAction).toHaveBeenCalled();
  });

  it('handles multiple shortcuts', () => {
    const mockAction1 = vi.fn();
    const mockAction2 = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction1,
        description: 'First shortcut'
      },
      {
        key: 'n',
        action: mockAction2,
        description: 'Second shortcut'
      }
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    // Test first shortcut
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      }));
    });

    expect(mockAction1).toHaveBeenCalled();

    // Test second shortcut
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'n'
      }));
    });

    expect(mockAction2).toHaveBeenCalled();
  });

  it('respects modifier keys', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction,
        description: 'Test shortcut'
      }
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    // Should not trigger without Ctrl
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k'
      }));
    });

    expect(mockAction).not.toHaveBeenCalled();

    // Should trigger with Ctrl
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      }));
    });

    expect(mockAction).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const mockAction = vi.fn();
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        action: mockAction,
        description: 'Test shortcut'
      }
    ];

    const { unmount } = renderHook(() => useKeyboardNavigation(shortcuts));

    unmount();

    // Should not trigger after unmount
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      }));
    });

    expect(mockAction).not.toHaveBeenCalled();
  });
});

describe('useGlobalKeyboardShortcuts', () => {
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <input data-search-input />
      <button data-create-task>Create Task</button>
    `;
  });

  it('focuses search input on Ctrl+K', () => {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    const focusSpy = vi.spyOn(searchInput, 'focus');

    renderHook(() => useGlobalKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      }));
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('focuses search input on Cmd+K (Mac)', () => {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    const focusSpy = vi.spyOn(searchInput, 'focus');

    renderHook(() => useGlobalKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true
      }));
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('clicks create task button on N key', () => {
    const createButton = document.querySelector('[data-create-task]') as HTMLButtonElement;
    const clickSpy = vi.spyOn(createButton, 'click');

    renderHook(() => useGlobalKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'n'
      }));
    });

    expect(clickSpy).toHaveBeenCalled();
  });

  it('focuses search input on / key', () => {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    const focusSpy = vi.spyOn(searchInput, 'focus');

    renderHook(() => useGlobalKeyboardShortcuts());

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: '/'
      }));
    });

    expect(focusSpy).toHaveBeenCalled();
  });
});