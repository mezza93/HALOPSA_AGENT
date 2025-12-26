'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Users,
  FileText,
  Workflow,
  Mail,
  ScrollText,
  Database,
  Link2,
  Lightbulb,
  ChevronRight,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface KnowledgeBaseItem {
  id: string;
  category: string;
  subcategory: string | null;
  title: string;
  content: string;
  summary: string | null;
  sourceId: string | null;
  sourceName: string | null;
  updatedAt: Date;
}

interface SyncStatus {
  id: string;
  status: string;
  syncType: string;
  itemsAdded: number;
  itemsUpdated: number;
  itemsRemoved: number;
  errorCount: number;
  syncedAt: Date;
}

interface KnowledgeBaseViewProps {
  items: KnowledgeBaseItem[];
  syncStatus: SyncStatus | null;
  userId: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  CONFIGURATION: Settings,
  CLIENTS: Users,
  AGENTS: Users,
  WORKFLOWS: Workflow,
  TEMPLATES: Mail,
  CONTRACTS: ScrollText,
  CUSTOM_FIELDS: Database,
  INTEGRATIONS: Link2,
  BEST_PRACTICES: Lightbulb,
};

const categoryLabels: Record<string, string> = {
  CONFIGURATION: 'Configuration',
  CLIENTS: 'Clients',
  AGENTS: 'Agents & Teams',
  WORKFLOWS: 'Workflows',
  TEMPLATES: 'Templates',
  CONTRACTS: 'Contracts & SLAs',
  CUSTOM_FIELDS: 'Custom Fields',
  INTEGRATIONS: 'Integrations',
  BEST_PRACTICES: 'Best Practices',
};

export function KnowledgeBaseView({ items, syncStatus, userId }: KnowledgeBaseViewProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Group items by category
  const itemsByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, KnowledgeBaseItem[]>);

  // Get all categories (including empty ones for UI)
  const allCategories = Object.keys(categoryLabels);

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/knowledge-base/sync', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sync failed');
      }

      const result = await response.json();
      toast.success(`Synced ${result.itemsAdded} new items, updated ${result.itemsUpdated}`);

      // Reload page to show new data
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync knowledge base');
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter items by search
  const filteredItems = selectedCategory
    ? (itemsByCategory[selectedCategory] || []).filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-turquoise-600" />
            <h1 className="text-lg font-semibold">Knowledge Base</h1>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
              'bg-turquoise-500 hover:bg-turquoise-600 text-white',
              isSyncing && 'opacity-50 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync from HaloPSA'}
          </button>

          {/* Sync status */}
          {syncStatus && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              {syncStatus.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              ) : syncStatus.status === 'FAILED' ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-500" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              <span>
                Last synced: {new Date(syncStatus.syncedAt).toLocaleDateString()}{' '}
                {new Date(syncStatus.syncedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Categories */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {allCategories.map((category) => {
            const Icon = categoryIcons[category] || FileText;
            const count = itemsByCategory[category]?.length || 0;
            const isActive = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300'
                    : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{categoryLabels[category]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    count > 0
                      ? 'bg-turquoise-100 dark:bg-turquoise-900/50 text-turquoise-700 dark:text-turquoise-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  )}>
                    {count}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Stats */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{items.length}</span> total items synced
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {selectedCategory ? (
          <>
            {/* Category header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">{categoryLabels[selectedCategory]}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredItems.length} items in this category
              </p>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-500"
                />
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredItems.length > 0 ? (
                <div className="space-y-3">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-turquoise-300 dark:hover:border-turquoise-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          {item.subcategory && (
                            <span className="text-xs text-muted-foreground">
                              {item.subcategory}
                            </span>
                          )}
                        </div>
                        {item.sourceId && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            ID: {item.sourceId}
                          </span>
                        )}
                      </div>
                      {item.summary && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                      <div className="mt-3 text-xs text-muted-foreground">
                        Updated: {new Date(item.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No items in this category</p>
                  <p className="text-sm mt-1">Click "Sync from HaloPSA" to populate</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-6">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-turquoise-500/50" />
              <h2 className="text-xl font-semibold mb-2">Your AI Knowledge Base</h2>
              <p className="text-muted-foreground mb-6">
                Sync your HaloPSA configuration to help the AI assistant understand your setup.
                This includes ticket types, priorities, categories, workflows, and more.
              </p>
              {items.length === 0 ? (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium transition-all',
                    'bg-turquoise-500 hover:bg-turquoise-600 text-white',
                    isSyncing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                  {isSyncing ? 'Syncing...' : 'Start Initial Sync'}
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a category from the sidebar to view items
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
