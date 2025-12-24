'use client';

import { memo } from 'react';
import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isLoading,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'flex gap-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-gray-200 dark:bg-gray-700'
            : 'bg-turquoise-500'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
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
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-tl-md'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-turquoise prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (!inline && match) {
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
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !mt-0"
                            {...props}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-turquoise-600 dark:text-turquoise-400"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left font-semibold">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">
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
                        className="text-turquoise-600 dark:text-turquoise-400 hover:underline"
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

        {/* Tool calls indicator */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.toolInvocations.map((tool, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 px-2 py-1 text-xs text-turquoise-700 dark:text-turquoise-300"
              >
                <Sparkles className="h-3 w-3" />
                {tool.toolName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
