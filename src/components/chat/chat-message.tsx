'use client';

import { memo, useMemo } from 'react';
import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter, SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Sparkles, Copy, Check, Clock } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

function formatTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  // If less than 1 minute ago
  if (minutes < 1) return 'Just now';
  // If less than 1 hour ago
  if (minutes < 60) return `${minutes}m ago`;
  // If today, show time
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  // If yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  // Otherwise show date
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isLoading,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = message.role === 'user';

  const timestamp = useMemo(() => formatTime(message.createdAt), [message.createdAt]);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'group flex gap-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-gray-200'
            : 'bg-turquoise-500'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-gray-600" />
        ) : (
          <Sparkles className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          'flex-1 space-y-2',
          isUser ? 'flex justify-end' : ''
        )}
      >
        <div
          className={cn(
            'inline-block max-w-full rounded-2xl px-4 py-3',
            isUser
              ? 'bg-turquoise-500 text-white rounded-tr-md'
              : 'bg-white border border-gray-200 rounded-tl-md'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-turquoise prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');
                    const isInline = !match;

                    if (!isInline && match) {
                      return (
                        <div className="relative group">
                          <button
                            onClick={() => copyToClipboard(codeString)}
                            className="absolute right-2 top-2 rounded-md bg-gray-700 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                            title="Copy code"
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <SyntaxHighlighter
                            style={oneDark as SyntaxHighlighterProps['style']}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !mt-0"
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-turquoise-600"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-gray-200 px-3 py-2">
                        {children}
                      </td>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-turquoise-600 hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Timestamp - shows on hover */}
        {timestamp && (
          <div className={cn(
            'flex items-center gap-2',
            isUser ? 'justify-end' : 'justify-start'
          )}>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs text-gray-400 transition-opacity',
                showTimestamp ? 'opacity-100' : 'opacity-0'
              )}
            >
              <Clock className="h-3 w-3" />
              {timestamp}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
