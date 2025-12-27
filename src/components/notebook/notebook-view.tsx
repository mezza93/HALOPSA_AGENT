'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BookMarked,
  Search,
  Pin,
  Trash2,
  Tag,
  Clock,
  Users,
  Ticket,
  User,
  Box,
  FileText,
  BarChart3,
  Briefcase,
  Brain,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NotebookEntry {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  relatedEntities: Array<{ type: string; id: string; name: string }> | null;
  sessionId: string | null;
  isPinned: boolean;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Memory {
  id: string;
  entityType: string;
  entityId: string | null;
  entityName: string;
  summary: string;
  keyFacts: Record<string, unknown> | null;
  sentiment: string | null;
  importance: number;
  lastAccessedAt: string;
}

interface NotebookViewProps {
  entries: NotebookEntry[];
  memories: Memory[];
  userId: string;
}

const entityIcons: Record<string, React.ElementType> = {
  CLIENT: Users,
  TICKET: Ticket,
  AGENT: User,
  ASSET: Box,
  CONTRACT: FileText,
  PROJECT: Briefcase,
  REPORT: BarChart3,
  GENERAL: Brain,
};

type ViewMode = 'notebook' | 'memory';
type SortBy = 'newest' | 'oldest' | 'pinned' | 'importance';

export function NotebookView({ entries, memories, userId }: NotebookViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('notebook');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(null);
  const [localEntries, setLocalEntries] = useState(entries);

  // Get unique categories
  const categories = [...new Set(localEntries.map((e) => e.category).filter(Boolean))] as string[];

  // Filter and sort entries
  const filteredEntries = localEntries
    .filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      }
      if (sortBy === 'newest' || sortBy === 'pinned') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  // Filter and sort memories
  const filteredMemories = memories
    .filter((memory) => {
      return (
        memory.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortBy === 'importance') {
        return b.importance - a.importance;
      }
      return new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime();
    });

  // Handle pin toggle
  const handleTogglePin = async (entryId: string, currentPinned: boolean) => {
    try {
      const response = await fetch(`/api/notebook/${entryId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });

      if (!response.ok) throw new Error('Failed to update pin status');

      setLocalEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, isPinned: !currentPinned } : e))
      );
      toast.success(currentPinned ? 'Unpinned' : 'Pinned to top');
    } catch {
      toast.error('Failed to update pin status');
    }
  };

  // Handle delete
  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notebook/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setLocalEntries((prev) => prev.filter((e) => e.id !== entryId));
      if (selectedEntry?.id === entryId) setSelectedEntry(null);
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-gray-50/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <BookMarked className="h-5 w-5 text-turquoise-600" />
            <h1 className="text-lg font-semibold">Notebook</h1>
          </div>

          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('notebook')}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm rounded-md transition-all',
                viewMode === 'notebook'
                  ? 'bg-white text-turquoise-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Notes
            </button>
            <button
              onClick={() => setViewMode('memory')}
              className={cn(
                'flex-1 px-3 py-1.5 text-sm rounded-md transition-all',
                viewMode === 'memory'
                  ? 'bg-white text-turquoise-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Context
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-500"
            />
          </div>
        </div>

        {/* Categories (Notebook mode only) */}
        {viewMode === 'notebook' && categories.length > 0 && (
          <div className="p-3 border-b border-gray-200">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full transition-all',
                  !selectedCategory
                    ? 'bg-turquoise-100 text-turquoise-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full transition-all',
                    selectedCategory === category
                      ? 'bg-turquoise-100 text-turquoise-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort options */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="flex-1 text-sm bg-transparent border-none focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="pinned">Pinned first</option>
              {viewMode === 'memory' && <option value="importance">Most important</option>}
            </select>
          </div>
        </div>

        {/* List */}
        <nav className="flex-1 overflow-y-auto p-2">
          {viewMode === 'notebook' ? (
            filteredEntries.length > 0 ? (
              <div className="space-y-1">
                {filteredEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all',
                      selectedEntry?.id === entry.id
                        ? 'bg-turquoise-100 text-turquoise-800'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {entry.isPinned && (
                        <Pin className="h-3 w-3 text-turquoise-500 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{entry.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {entry.content.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {entry.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            <Tag className="h-2.5 w-2.5" />
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{entry.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-xs mt-1">Ask the AI to save findings</p>
              </div>
            )
          ) : filteredMemories.length > 0 ? (
            <div className="space-y-1">
              {filteredMemories.map((memory) => {
                const Icon = entityIcons[memory.entityType] || Brain;
                return (
                  <div
                    key={memory.id}
                    className="px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-turquoise-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{memory.entityName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {memory.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {new Date(memory.lastAccessedAt).toLocaleDateString()}
                          {memory.importance >= 7 && (
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                              Important
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No context saved</p>
              <p className="text-xs mt-1">Context is auto-saved from chats</p>
            </div>
          )}
        </nav>

        {/* Stats */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-900">
              {viewMode === 'notebook' ? localEntries.length : memories.length}
            </span>{' '}
            {viewMode === 'notebook' ? 'notes saved' : 'context items'}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col bg-white">
        {viewMode === 'notebook' && selectedEntry ? (
          <>
            {/* Entry header */}
            <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">{selectedEntry.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(selectedEntry.createdAt).toLocaleDateString()}
                  </span>
                  {selectedEntry.category && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {selectedEntry.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(selectedEntry.id, selectedEntry.isPinned)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    selectedEntry.isPinned
                      ? 'bg-turquoise-100 text-turquoise-600'
                      : 'hover:bg-gray-100 text-gray-400'
                  )}
                  title={selectedEntry.isPinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedEntry.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Entry content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{selectedEntry.content}</div>
              </div>

              {/* Tags */}
              {selectedEntry.tags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEntry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related entities */}
              {selectedEntry.relatedEntities && selectedEntry.relatedEntities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-2">Related to</h4>
                  <div className="space-y-1">
                    {selectedEntry.relatedEntities.map((entity, index) => {
                      const Icon = entityIcons[entity.type] || FileText;
                      return (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 mr-3 text-sm text-gray-600"
                        >
                          <Icon className="h-4 w-4 text-turquoise-500" />
                          <span>{entity.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <BookMarked className="h-16 w-16 mx-auto mb-4 text-turquoise-500/50" />
              <h2 className="text-xl font-semibold mb-2">
                {viewMode === 'notebook' ? 'Your AI Notebook' : 'Conversation Context'}
              </h2>
              <p className="text-gray-500 mb-6">
                {viewMode === 'notebook'
                  ? 'Save important findings from your AI conversations. Ask the AI to "save this to my notebook" when you find something worth remembering.'
                  : 'Context is automatically remembered from your conversations. The AI will recall relevant information about clients, tickets, and insights when you chat.'}
              </p>
              {viewMode === 'notebook' && localEntries.length > 0 && (
                <p className="text-sm text-gray-500">
                  <ChevronRight className="h-4 w-4 inline" />
                  Select a note from the sidebar to view
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
