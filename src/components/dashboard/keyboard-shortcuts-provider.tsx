'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { CommandPalette } from '@/components/ui/command-palette';

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const router = useRouter();

  const handleCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const handlePromptSelect = useCallback((prompt: string) => {
    // Navigate to chat with the prompt as a query parameter
    const encoded = encodeURIComponent(prompt);
    router.push(`/chat?prompt=${encoded}`);
  }, [router]);

  useKeyboardShortcuts({
    onCommandPalette: handleCommandPalette,
  });

  return (
    <>
      {children}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onPromptSelect={handlePromptSelect}
      />
    </>
  );
}
