'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Settings,
  History,
  BookOpen,
  Lightbulb,
  Map,
  Shield,
  Search,
  Ticket,
  Users,
  BarChart3,
  HelpCircle,
  RefreshCw,
  Zap,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CommandItem {
  id: string;
  name: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'quick-prompts';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptSelect?: (prompt: string) => void;
}

export function CommandPalette({ isOpen, onClose, onPromptSelect }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const commands = useMemo<CommandItem[]>(() => [
    // Navigation
    { id: 'chat', name: 'Chat', description: 'Open AI assistant', icon: MessageSquare, action: () => router.push('/chat'), keywords: ['ai', 'assistant', 'talk'], category: 'navigation' },
    { id: 'history', name: 'History', description: 'View past conversations', icon: History, action: () => router.push('/chat/history'), keywords: ['past', 'conversations', 'previous'], category: 'navigation' },
    { id: 'kb', name: 'Knowledge Base', description: 'HaloPSA configuration', icon: BookOpen, action: () => router.push('/knowledge-base'), keywords: ['sync', 'config', 'data'], category: 'navigation' },
    { id: 'opportunities', name: 'Opportunities', description: 'Optimization suggestions', icon: Lightbulb, action: () => router.push('/opportunities'), keywords: ['optimize', 'improve', 'suggestions'], category: 'navigation' },
    { id: 'roadmap', name: 'Roadmap', description: 'Product roadmap', icon: Map, action: () => router.push('/roadmap'), keywords: ['features', 'upcoming', 'planned'], category: 'navigation' },
    { id: 'settings', name: 'Settings', description: 'Account preferences', icon: Settings, action: () => router.push('/settings'), keywords: ['account', 'preferences', 'profile'], category: 'navigation' },
    { id: 'connections', name: 'Connections', description: 'Manage HaloPSA connections', icon: Zap, action: () => router.push('/settings/connections'), keywords: ['halopsa', 'api', 'connect'], category: 'navigation' },

    // Quick prompts
    { id: 'prompt-tickets', name: 'Show open tickets', description: 'View all open tickets', icon: Ticket, action: () => onPromptSelect?.('Show me all open tickets'), keywords: ['tickets', 'open', 'list'], category: 'quick-prompts' },
    { id: 'prompt-sla', name: 'SLA breaches', description: 'Check SLA status', icon: BarChart3, action: () => onPromptSelect?.('Show me any SLA breaches or tickets at risk'), keywords: ['sla', 'breach', 'overdue'], category: 'quick-prompts' },
    { id: 'prompt-clients', name: 'Top clients', description: 'Clients with most tickets', icon: Users, action: () => onPromptSelect?.('Which clients have the most open tickets?'), keywords: ['clients', 'customers', 'top'], category: 'quick-prompts' },
    { id: 'prompt-dashboard', name: 'Create dashboard', description: 'Build a new dashboard', icon: BarChart3, action: () => onPromptSelect?.('Create a service desk dashboard with key metrics'), keywords: ['dashboard', 'create', 'build'], category: 'quick-prompts' },

    // Actions
    { id: 'sync', name: 'Sync Knowledge Base', description: 'Refresh HaloPSA data', icon: RefreshCw, action: () => { router.push('/knowledge-base'); }, keywords: ['refresh', 'update', 'sync'], category: 'actions' },
    { id: 'help', name: 'Help & Support', description: 'Get help', icon: HelpCircle, action: () => router.push('/help'), keywords: ['help', 'support', 'docs'], category: 'actions' },
  ], [router, onPromptSelect]);

  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter(cmd => {
      const nameMatch = cmd.name.toLowerCase().includes(searchLower);
      const descMatch = cmd.description?.toLowerCase().includes(searchLower);
      const keywordMatch = cmd.keywords?.some(k => k.includes(searchLower));
      return nameMatch || descMatch || keywordMatch;
    });
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      'navigation': [],
      'quick-prompts': [],
      'actions': [],
    };

    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  const handleSelect = useCallback((command: CommandItem) => {
    command.action();
    onClose();
    setSearch('');
  }, [onClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) handleSelect(selected);
    } else if (event.key === 'Escape') {
      onClose();
    }
  }, [filteredCommands, selectedIndex, handleSelect, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    'navigation': 'Navigation',
    'quick-prompts': 'Quick Prompts',
    'actions': 'Actions',
  };

  let globalIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command palette */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, prompts, or pages..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
            autoComplete="off"
          />
          <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 rounded border border-gray-200">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {categoryLabels[category]}
                  </div>
                  {items.map((cmd) => {
                    globalIndex++;
                    const currentIndex = globalIndex;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => handleSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          isSelected
                            ? 'bg-turquoise-50 text-turquoise-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        )}
                      >
                        <cmd.icon className={cn(
                          'h-4 w-4',
                          isSelected ? 'text-turquoise-600' : 'text-gray-400'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{cmd.name}</div>
                          {cmd.description && (
                            <div className="text-xs text-gray-500 truncate">{cmd.description}</div>
                          )}
                        </div>
                        {isSelected && (
                          <kbd className="text-xs font-mono text-turquoise-600 bg-turquoise-100 px-1.5 py-0.5 rounded">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">↵</kbd>
              <span>Select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-200">Esc</kbd>
            <span>Close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
