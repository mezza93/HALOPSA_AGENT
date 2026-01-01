'use client';

import { useState, useEffect } from 'react';
import { Zap, Infinity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TokenUsageData {
  tokensUsed: number;
  tokensRemaining: number;
  monthlyLimit: number;
  percentUsed: number;
  hasLimit: boolean;
  isUnlimited: boolean;
}

interface TokenUsageBarProps {
  className?: string;
  compact?: boolean;
}

export function TokenUsageBar({ className, compact = false }: TokenUsageBarProps) {
  const [usage, setUsage] = useState<TokenUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const response = await fetch('/api/user/token-usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch token usage:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsage();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-2 bg-gray-200 rounded-full w-20" />
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  // Unlimited users
  if (usage.isUnlimited) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Infinity className="h-4 w-4 text-turquoise-500" />
        <span className="text-muted-foreground">Unlimited</span>
      </div>
    );
  }

  const percentUsed = Math.min(usage.percentUsed, 100);
  const isWarning = percentUsed >= 75 && percentUsed < 90;
  const isDanger = percentUsed >= 90;

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Zap className={cn(
          'h-4 w-4',
          isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-turquoise-500'
        )} />
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-turquoise-500'
              )}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{percentUsed}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Zap className={cn(
            'h-4 w-4',
            isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-turquoise-500'
          )} />
          <span className="font-medium">Token Usage</span>
        </div>
        <span className="text-muted-foreground">
          {formatTokens(usage.tokensUsed)} / {formatTokens(usage.monthlyLimit)}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-turquoise-500'
          )}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {usage.tokensRemaining > 0 ? (
          <>
            {formatTokens(usage.tokensRemaining)} tokens remaining this month
          </>
        ) : (
          <span className="text-red-500">
            Token limit reached. Resets on the 1st of next month.
          </span>
        )}
      </p>
    </div>
  );
}
