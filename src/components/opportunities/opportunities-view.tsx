'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Link2,
  BookOpen,
  Settings,
  Workflow,
  Users,
  FileText,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface Connection {
  id: string;
  name: string;
  baseUrl: string;
  isDefault: boolean;
  lastUsedAt: string | null;
}

interface OpportunitiesViewProps {
  userId: string;
  connections: Connection[];
  kbItemsCount: number;
  lastSyncAt: string | null;
}

interface Opportunity {
  id: string;
  category: 'setup' | 'optimization' | 'best_practices' | 'growth';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  icon: React.ElementType;
  isCompleted: boolean;
}

const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
  setup: { label: 'Initial Setup', icon: Settings },
  optimization: { label: 'Optimization', icon: Zap },
  best_practices: { label: 'Best Practices', icon: Shield },
  growth: { label: 'Growth', icon: TrendingUp },
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function OpportunitiesView({
  userId,
  connections,
  kbItemsCount,
  lastSyncAt,
}: OpportunitiesViewProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Calculate opportunities based on current state
  const opportunities: Opportunity[] = [
    // Setup opportunities
    {
      id: 'connection',
      category: 'setup',
      priority: 'high',
      title: 'Connect to HaloPSA',
      description: 'Set up your first HaloPSA connection to start using the AI assistant.',
      actionLabel: 'Add Connection',
      actionHref: '/settings/connections',
      icon: Link2,
      isCompleted: connections.length > 0,
    },
    {
      id: 'knowledge-base',
      category: 'setup',
      priority: 'high',
      title: 'Sync Knowledge Base',
      description: 'Import your HaloPSA configuration so the AI understands your setup.',
      actionLabel: 'Sync Now',
      actionHref: '/knowledge-base',
      icon: BookOpen,
      isCompleted: kbItemsCount > 0,
    },
    {
      id: 'default-connection',
      category: 'setup',
      priority: 'medium',
      title: 'Set Default Connection',
      description: 'Choose a default connection for quick access in chat.',
      actionLabel: 'Configure',
      actionHref: '/settings/connections',
      icon: Link2,
      isCompleted: connections.some((c) => c.isDefault),
    },

    // Optimization opportunities
    {
      id: 'multiple-connections',
      category: 'optimization',
      priority: 'low',
      title: 'Add Multiple Connections',
      description: 'Connect to multiple HaloPSA instances for different clients or environments.',
      actionLabel: 'Add Connection',
      actionHref: '/settings/connections',
      icon: Link2,
      isCompleted: connections.length >= 2,
    },
    {
      id: 'recent-sync',
      category: 'optimization',
      priority: 'medium',
      title: 'Keep Knowledge Base Updated',
      description: 'Sync your knowledge base regularly to ensure the AI has the latest configuration.',
      actionLabel: 'Sync',
      actionHref: '/knowledge-base',
      icon: RefreshCw,
      isCompleted: lastSyncAt
        ? new Date().getTime() - new Date(lastSyncAt).getTime() < 7 * 24 * 60 * 60 * 1000
        : false,
    },

    // Best practices
    {
      id: 'workflows',
      category: 'best_practices',
      priority: 'low',
      title: 'Configure Workflows',
      description: 'Set up automated workflows in HaloPSA to streamline ticket handling.',
      actionLabel: 'View Guide',
      actionHref: '/help',
      icon: Workflow,
      isCompleted: false,
    },
    {
      id: 'team-setup',
      category: 'best_practices',
      priority: 'low',
      title: 'Set Up Teams',
      description: 'Organize your technicians into teams for better ticket routing.',
      actionLabel: 'Learn More',
      actionHref: '/help',
      icon: Users,
      isCompleted: false,
    },
    {
      id: 'templates',
      category: 'best_practices',
      priority: 'low',
      title: 'Create Response Templates',
      description: 'Save time with pre-built response templates for common issues.',
      actionLabel: 'View Guide',
      actionHref: '/help',
      icon: FileText,
      isCompleted: false,
    },

    // Growth opportunities
    {
      id: 'reporting',
      category: 'growth',
      priority: 'low',
      title: 'Explore Reporting',
      description: 'Use the AI to generate custom reports and gain insights into your operations.',
      actionLabel: 'Try It',
      actionHref: '/chat',
      icon: TrendingUp,
      isCompleted: false,
    },
    {
      id: 'sla-tracking',
      category: 'growth',
      priority: 'medium',
      title: 'Monitor SLA Performance',
      description: 'Track SLA compliance and identify areas for improvement.',
      actionLabel: 'Ask AI',
      actionHref: '/chat',
      icon: Clock,
      isCompleted: false,
    },
  ];

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (filter === 'pending' && opp.isCompleted) return false;
    if (filter === 'completed' && !opp.isCompleted) return false;
    if (categoryFilter && opp.category !== categoryFilter) return false;
    return true;
  });

  // Group by category
  const groupedOpportunities = filteredOpportunities.reduce((acc, opp) => {
    if (!acc[opp.category]) {
      acc[opp.category] = [];
    }
    acc[opp.category].push(opp);
    return acc;
  }, {} as Record<string, Opportunity[]>);

  // Calculate stats
  const completedCount = opportunities.filter((o) => o.isCompleted).length;
  const pendingCount = opportunities.filter((o) => !o.isCompleted).length;
  const highPriorityCount = opportunities.filter((o) => !o.isCompleted && o.priority === 'high').length;

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-gray-50/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-5 w-5 text-turquoise-600" />
            <h1 className="text-lg font-semibold">Opportunities</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Discover ways to get more from HaloPSA
          </p>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-turquoise-600">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="rounded-xl bg-white border border-gray-200 p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
          {highPriorityCount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 p-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-700">
                {highPriorityCount} high priority {highPriorityCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => setFilter('pending')}
            className={cn(
              'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
              filter === 'pending'
                ? 'bg-turquoise-100 text-turquoise-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>Pending</span>
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={cn(
              'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
              filter === 'completed'
                ? 'bg-turquoise-100 text-turquoise-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>Completed</span>
            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
              {completedCount}
            </span>
          </button>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
              filter === 'all'
                ? 'bg-turquoise-100 text-turquoise-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>All</span>
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs">
              {opportunities.length}
            </span>
          </button>
        </div>

        {/* Category filters */}
        <div className="p-3 border-t border-gray-200">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-3">Categories</p>
          <div className="space-y-1">
            {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                  categoryFilter === key
                    ? 'bg-turquoise-100 text-turquoise-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-white p-6">
        <div className="mx-auto max-w-3xl">
          {Object.keys(groupedOpportunities).length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <h2 className="text-lg font-semibold mb-2">
                {filter === 'pending' ? 'All caught up!' : 'No completed items yet'}
              </h2>
              <p className="text-muted-foreground">
                {filter === 'pending'
                  ? 'You\'ve completed all pending opportunities.'
                  : 'Complete some opportunities to see them here.'}
              </p>
            </div>
          ) : (
            Object.entries(groupedOpportunities).map(([category, opps]) => {
              const { label, icon: CategoryIcon } = categoryLabels[category];
              return (
                <div key={category} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <CategoryIcon className="h-5 w-5 text-turquoise-600" />
                    <h2 className="text-lg font-semibold">{label}</h2>
                    <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                      {opps.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {opps.map((opp) => (
                      <div
                        key={opp.id}
                        className={cn(
                          'rounded-xl border p-4 transition-all',
                          opp.isCompleted
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-gray-200 hover:border-turquoise-300 hover:shadow-sm'
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                              opp.isCompleted
                                ? 'bg-green-100 text-green-600'
                                : 'bg-turquoise-100 text-turquoise-600'
                            )}
                          >
                            {opp.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <opp.icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-medium">{opp.title}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {opp.description}
                                </p>
                              </div>
                              {!opp.isCompleted && (
                                <span
                                  className={cn(
                                    'shrink-0 text-xs px-2 py-0.5 rounded border',
                                    priorityColors[opp.priority]
                                  )}
                                >
                                  {opp.priority}
                                </span>
                              )}
                            </div>
                            {!opp.isCompleted && (
                              <div className="mt-3">
                                <Link href={opp.actionHref}>
                                  <Button size="sm" variant="outline" className="group">
                                    {opp.actionLabel}
                                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
