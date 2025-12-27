'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

const navigation = [
  { key: '1', path: '/chat', name: 'Chat' },
  { key: '2', path: '/chat/history', name: 'History' },
  { key: '3', path: '/knowledge-base', name: 'Knowledge Base' },
  { key: '4', path: '/opportunities', name: 'Opportunities' },
  { key: '5', path: '/roadmap', name: 'Roadmap' },
  { key: '6', path: '/settings', name: 'Settings' },
];

interface UseKeyboardShortcutsOptions {
  onCommandPalette?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { onCommandPalette, enabled = true } = options;
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isTyping = target.tagName === 'INPUT' ||
                     target.tagName === 'TEXTAREA' ||
                     target.isContentEditable;

    // Command palette: Cmd/Ctrl + K
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      onCommandPalette?.();
      return;
    }

    // Don't process number shortcuts if typing
    if (isTyping) return;

    // Navigation shortcuts: 1-6
    const navItem = navigation.find(n => n.key === event.key);
    if (navItem && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      router.push(navItem.path);
      return;
    }

    // Escape to close modals (handled by individual components)
    // but we can emit a custom event
    if (event.key === 'Escape') {
      document.dispatchEvent(new CustomEvent('keyboard:escape'));
    }

    // Quick new chat: N
    if (event.key === 'n' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      router.push('/chat');
      return;
    }

    // Go back: Backspace (when not typing)
    if (event.key === 'Backspace') {
      event.preventDefault();
      router.back();
      return;
    }
  }, [router, onCommandPalette]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return {
    shortcuts: [
      ...navigation.map(n => ({ key: n.key, description: `Go to ${n.name}` })),
      { key: '⌘K', description: 'Open command palette' },
      { key: 'N', description: 'New chat' },
      { key: '←', description: 'Go back' },
    ],
  };
}

export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handler, enabled]);
}
