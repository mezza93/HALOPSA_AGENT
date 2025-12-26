'use client';

import { useState } from 'react';
import {
  Rocket,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  Target,
  Lightbulb,
  TrendingUp,
  ChevronRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'integration';
  priority: 'high' | 'medium' | 'low';
  progress?: number;
  votes?: number;
}

interface RoadmapColumn {
  id: 'in-progress' | 'planned' | 'future';
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  items: RoadmapItem[];
}

const roadmapData: RoadmapColumn[] = [
  {
    id: 'in-progress',
    title: 'In Progress',
    icon: Rocket,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    items: [
      {
        id: '1',
        title: 'Advanced Reporting Dashboard',
        description: 'Custom SQL reports with interactive charts and scheduled exports',
        category: 'feature',
        priority: 'high',
        progress: 75,
      },
      {
        id: '2',
        title: 'Bulk Ticket Operations',
        description: 'Select and update multiple tickets at once with batch actions',
        category: 'improvement',
        priority: 'high',
        progress: 60,
      },
      {
        id: '3',
        title: 'Smart Ticket Routing',
        description: 'AI-powered automatic ticket assignment based on skills and workload',
        category: 'feature',
        priority: 'medium',
        progress: 40,
      },
    ],
  },
  {
    id: 'planned',
    title: 'Planned',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    items: [
      {
        id: '4',
        title: 'Mobile App',
        description: 'Native iOS and Android apps for on-the-go ticket management',
        category: 'feature',
        priority: 'high',
        votes: 128,
      },
      {
        id: '5',
        title: 'Slack Integration',
        description: 'Create and manage tickets directly from Slack channels',
        category: 'integration',
        priority: 'medium',
        votes: 89,
      },
      {
        id: '6',
        title: 'Custom Workflows Builder',
        description: 'Visual drag-and-drop workflow automation builder',
        category: 'feature',
        priority: 'medium',
        votes: 67,
      },
      {
        id: '7',
        title: 'Asset Discovery',
        description: 'Automatic network scanning and asset inventory updates',
        category: 'feature',
        priority: 'low',
        votes: 45,
      },
    ],
  },
  {
    id: 'future',
    title: 'Future',
    icon: Lightbulb,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    items: [
      {
        id: '8',
        title: 'AI Ticket Resolution',
        description: 'Automatic resolution suggestions based on historical data',
        category: 'feature',
        priority: 'high',
        votes: 234,
      },
      {
        id: '9',
        title: 'Multi-Tenant Dashboard',
        description: 'Single view across multiple HaloPSA instances',
        category: 'feature',
        priority: 'medium',
        votes: 156,
      },
      {
        id: '10',
        title: 'Voice Commands',
        description: 'Create tickets and run queries using voice input',
        category: 'feature',
        priority: 'low',
        votes: 78,
      },
      {
        id: '11',
        title: 'Teams Integration',
        description: 'Microsoft Teams bot for ticket notifications and actions',
        category: 'integration',
        priority: 'medium',
        votes: 112,
      },
      {
        id: '12',
        title: 'Client Portal',
        description: 'Branded self-service portal for end clients',
        category: 'feature',
        priority: 'low',
        votes: 89,
      },
    ],
  },
];

const categoryStyles = {
  feature: { bg: 'bg-turquoise-100', text: 'text-turquoise-700', label: 'Feature' },
  improvement: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Improvement' },
  integration: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Integration' },
};

const priorityStyles = {
  high: { icon: Zap, color: 'text-red-500' },
  medium: { icon: TrendingUp, color: 'text-amber-500' },
  low: { icon: Circle, color: 'text-gray-400' },
};

export function RoadmapView() {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold heading-gradient">Product Roadmap</h1>
            <p className="text-muted-foreground mt-1">
              See what we're building and what's coming next
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-turquoise-50 border border-turquoise-200">
            <Sparkles className="h-5 w-5 text-turquoise-600" />
            <span className="text-sm font-medium text-turquoise-700">
              {roadmapData.reduce((acc, col) => acc + col.items.length, 0)} items planned
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-8">
              {roadmapData.map((column, index) => (
                <div key={column.id} className="flex items-center gap-2">
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full',
                    column.bgColor
                  )}>
                    <column.icon className={cn('h-4 w-4', column.color)} />
                  </div>
                  <span className="text-sm font-medium">{column.title}</span>
                  <span className="text-xs text-muted-foreground">
                    ({column.items.length})
                  </span>
                  {index < roadmapData.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-gray-300 ml-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmapData.map((column) => (
            <div
              key={column.id}
              className={cn(
                'rounded-2xl border-2 overflow-hidden',
                column.borderColor
              )}
            >
              {/* Column Header */}
              <div className={cn(
                'px-5 py-4 border-b',
                column.bgColor,
                column.borderColor
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-xl',
                      'bg-white shadow-sm'
                    )}>
                      <column.icon className={cn('h-5 w-5', column.color)} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{column.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {column.items.length} {column.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column Items */}
              <div className="p-4 space-y-3 bg-gray-50/50 min-h-[400px]">
                {column.items.map((item) => {
                  const PriorityIcon = priorityStyles[item.priority].icon;
                  const isSelected = selectedItem === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(isSelected ? null : item.id)}
                      className={cn(
                        'p-4 rounded-xl bg-white border border-gray-200 cursor-pointer',
                        'transition-all duration-200 hover:shadow-md hover:border-turquoise-300',
                        isSelected && 'ring-2 ring-turquoise-500 border-turquoise-500'
                      )}
                    >
                      {/* Category & Priority */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          categoryStyles[item.category].bg,
                          categoryStyles[item.category].text
                        )}>
                          {categoryStyles[item.category].label}
                        </span>
                        <PriorityIcon className={cn(
                          'h-4 w-4',
                          priorityStyles[item.priority].color
                        )} />
                      </div>

                      {/* Title */}
                      <h3 className="font-medium text-gray-900 mb-1">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Progress or Votes */}
                      {item.progress !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-emerald-600">{item.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                      ) : item.votes !== undefined ? (
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-turquoise-50 hover:text-turquoise-600 transition-colors text-sm">
                            <Star className="h-3.5 w-3.5" />
                            <span className="font-medium">{item.votes}</span>
                          </button>
                          <span className="text-xs text-muted-foreground">votes</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-8">
        <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Legend:</span>
          <div className="flex items-center gap-4">
            {Object.entries(categoryStyles).map(([key, style]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  style.bg,
                  style.text
                )}>
                  {style.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">High Priority</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-muted-foreground">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
