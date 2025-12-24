'use client';

import { Link2, RotateCcw, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  connectionName?: string;
  onClear: () => void;
}

export function ChatHeader({ connectionName, onClear }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-lg px-4 py-3">
      {/* Connection status */}
      <div className="flex items-center gap-3">
        {connectionName ? (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-turquoise-100 dark:bg-turquoise-900/30">
              <Link2 className="h-4 w-4 text-turquoise-600 dark:text-turquoise-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{connectionName}</p>
              <p className="text-xs text-turquoise-600 dark:text-turquoise-400">
                Connected
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Link2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium">No Connection</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Set up a HaloPSA connection
              </p>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
