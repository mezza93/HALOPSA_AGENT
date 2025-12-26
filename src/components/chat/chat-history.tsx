'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MessageSquare,
  Search,
  Trash2,
  Pin,
  Archive,
  MoreVertical,
  Clock,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/format';

interface ChatSession {
  id: string;
  title: string | null;
  isArchived: boolean;
  isPinned: boolean;
  tokensUsed: number;
  createdAt: Date;
  lastMessageAt: Date;
  connection: {
    name: string;
  } | null;
  _count: {
    messages: number;
  };
}

interface ChatHistoryProps {
  sessions: ChatSession[];
}

export function ChatHistory({ sessions: initialSessions }: ChatHistoryProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived'>('all');

  const filteredSessions = sessions.filter((session) => {
    // Apply filter
    if (filter === 'pinned' && !session.isPinned) return false;
    if (filter === 'archived' && !session.isArchived) return false;
    if (filter === 'all' && session.isArchived) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = session.title?.toLowerCase() || '';
      const connectionName = session.connection?.name.toLowerCase() || '';
      return title.includes(query) || connectionName.includes(query);
    }

    return true;
  });

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleTogglePin = async (sessionId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      setSessions(
        sessions.map((s) =>
          s.id === sessionId ? { ...s, isPinned: !isPinned } : s
        )
      );
      toast.success(isPinned ? 'Unpinned' : 'Pinned');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleToggleArchive = async (sessionId: string, isArchived: boolean) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !isArchived }),
      });

      if (!response.ok) {
        throw new Error('Failed to update session');
      }

      setSessions(
        sessions.map((s) =>
          s.id === sessionId ? { ...s, isArchived: !isArchived } : s
        )
      );
      toast.success(isArchived ? 'Unarchived' : 'Archived');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'pinned', 'archived'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No conversations found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery
              ? 'Try a different search term'
              : filter === 'pinned'
              ? "You haven't pinned any conversations"
              : filter === 'archived'
              ? 'No archived conversations'
              : 'Start a new chat to begin'}
          </p>
          <Link href="/chat">
            <Button className="mt-4">Start New Chat</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="glass-card p-4 hover:shadow-glow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/chat/${session.id}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2">
                    {session.isPinned && (
                      <Pin className="h-4 w-4 text-turquoise-500" />
                    )}
                    <h3 className="font-medium truncate">
                      {session.title || 'Untitled conversation'}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(session.lastMessageAt)}
                    </span>
                    <span>{session._count.messages} messages</span>
                    {session.connection && (
                      <span className="flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5" />
                        {session.connection.name}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePin(session.id, session.isPinned)}
                    className="h-8 w-8 p-0"
                  >
                    <Pin
                      className={`h-4 w-4 ${
                        session.isPinned ? 'text-turquoise-500' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleArchive(session.id, session.isArchived)}
                    className="h-8 w-8 p-0"
                  >
                    <Archive
                      className={`h-4 w-4 ${
                        session.isArchived ? 'text-yellow-500' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
