'use client';

import { Link2, RotateCcw, Settings, Keyboard, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';
import { TokenUsageBar } from '@/components/ui/token-usage-bar';

interface ChatHeaderProps {
  connectionName?: string;
  onClear: () => void;
  isLoading?: boolean;
}

export function ChatHeader({ connectionName, onClear, isLoading }: ChatHeaderProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b border-gray-200 bg-background/80 backdrop-blur-lg px-4 py-3">
        {/* Connection status */}
        <div className="flex items-center gap-3">
          {connectionName ? (
            <Link
              href="/settings/connections"
              className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-gray-100"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-turquoise-100">
                <Link2 className="h-4 w-4 text-turquoise-600" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{connectionName}</p>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="success" dot className="text-[10px] px-1.5 py-0">
                    Connected
                  </Badge>
                  {isLoading && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 animate-pulse">
                      Processing...
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/settings/connections"
              className="flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-gray-100"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100">
                <Link2 className="h-4 w-4 text-yellow-600" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-yellow-500 border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">No Connection</p>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-xs text-yellow-600">
                  Click to set up HaloPSA
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Token Usage - Compact */}
          <div className="hidden sm:block">
            <TokenUsageBar compact />
          </div>

          <div className="flex items-center gap-1">
            <SimpleTooltip content="Keyboard shortcuts" side="bottom">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label="Show keyboard shortcuts"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </SimpleTooltip>

            <SimpleTooltip content="Start new chat" side="bottom">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground"
                aria-label="Start new chat"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            </SimpleTooltip>

            <SimpleTooltip content="Settings" side="bottom">
              <Button
                variant="ghost"
                size="icon-sm"
                asChild
                className="text-muted-foreground"
              >
                <Link href="/settings" aria-label="Settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </SimpleTooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
