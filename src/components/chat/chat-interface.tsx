'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
import { toast } from 'sonner';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatHeader } from './chat-header';
import { ChatWelcome } from './chat-welcome';
import { OptionCards } from './option-cards';
import { useConnectionStore } from '@/stores/connection-store';

interface ChatInterfaceProps {
  userId: string;
  sessionId?: string;
}

export function ChatInterface({ userId, sessionId: initialSessionId }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { activeConnection, initialize, isLoading: isLoadingConnection } = useConnectionStore();

  // Track the current session ID - starts with prop value or null
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);

  // Initialize connection store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const [tokenLimitError, setTokenLimitError] = useState<{
    tokensUsed: number;
    percentUsed: number;
  } | null>(null);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
  } = useChat({
    api: '/api/chat',
    body: {
      connectionId: activeConnection?.id,
      sessionId: currentSessionId,
    },
    onResponse: (response) => {
      // Capture session ID from the first response to maintain conversation continuity
      const sessionId = response.headers.get('X-Chat-Session-Id');
      if (sessionId && !currentSessionId) {
        setCurrentSessionId(sessionId);
      }
    },
    onError: (err) => {
      console.error('Chat error:', err);
      // Try to extract a user-friendly error message
      let errorMessage = 'Failed to send message. Please try again.';

      // Check if this is a token limit error (try to parse JSON from error message)
      try {
        // The error message might contain JSON data
        const jsonMatch = err.message?.match(/\{.*\}/);
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          if (errorData.error?.includes('token limit') || errorData.tokensUsed) {
            setTokenLimitError({
              tokensUsed: errorData.tokensUsed || 0,
              percentUsed: errorData.percentUsed || 100,
            });
            return; // Don't show toast, we'll show a custom UI
          }
        }
      } catch {
        // Not JSON, continue with normal error handling
      }

      if (err.message) {
        // Check for token limit in plain text
        if (err.message.includes('token limit') || err.message.includes('Monthly token limit')) {
          setTokenLimitError({ tokensUsed: 0, percentUsed: 100 });
          return;
        }
        // The AI SDK may return the error message from the API
        if (err.message.includes('AI service')) {
          errorMessage = err.message;
        } else if (err.message.includes('rate limit') || err.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err.message.includes('network') || err.message.includes('connection')) {
          errorMessage = 'Connection error. Please check your internet.';
        } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please refresh the page.';
        }
      }
      toast.error(errorMessage);
    },
    onFinish: () => {
      // Clear attachments after successful message
      setAttachments([]);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle form submission with attachments
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() && attachments.length === 0) {
      return;
    }

    // If there are attachments, upload them first
    if (attachments.length > 0) {
      try {
        const uploadPromises = attachments.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to upload file');
          }

          return response.json();
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // Include file info in the message
        const fileDescriptions = uploadedFiles
          .map((f) => `[Attached: ${f.fileName}]`)
          .join(' ');

        setInput(input + ' ' + fileDescriptions);
      } catch (err) {
        toast.error('Failed to upload attachments');
        return;
      }
    }

    handleSubmit(e);
  };

  // Handle quick action clicks
  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  // Handle option card selection
  const handleOptionSelect = useCallback((option: string) => {
    setInput(option);
    // Auto-submit after a short delay to show the selection
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 100);
  }, [setInput]);

  // Parse options from the last assistant message
  const getOptionsFromLastMessage = () => {
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return null;

    // Look for options in a specific format: [OPTIONS: option1 | option2 | option3]
    const optionsMatch = lastMessage.content.match(/\[OPTIONS:\s*([^\]]+)\]/i);
    if (optionsMatch) {
      const options = optionsMatch[1].split('|').map((o) => o.trim()).filter(Boolean);
      if (options.length >= 2) {
        return options;
      }
    }

    return null;
  };

  const options = getOptionsFromLastMessage();

  return (
    <div className="flex h-full flex-col relative">
      {/* Grainy texture overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.015]">
        <svg className="w-full h-full">
          <filter id="chat-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#chat-noise)"/>
        </svg>
      </div>

      {/* Chat header */}
      <ChatHeader
        connectionName={activeConnection?.name}
        onClear={() => window.location.reload()}
        isLoading={isLoading}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 relative z-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 ? (
            <ChatWelcome onQuickAction={handleQuickAction} />
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLoading={isLoading && message === messages[messages.length - 1]}
              />
            ))
          )}

          {/* Option cards */}
          {options && !isLoading && (
            <OptionCards
              options={options}
              onSelect={handleOptionSelect}
            />
          )}

          {/* Token Limit Error - User-friendly display */}
          {tokenLimitError && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-800">Monthly Token Limit Reached</h3>
              <p className="mt-2 text-amber-700">
                You've used all your tokens for this month.
              </p>
              <p className="mt-1 text-sm text-amber-600">
                Your usage will reset on the 1st of next month.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/settings"
                  className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                >
                  View Usage Details
                </a>
                <button
                  onClick={() => setTokenLimitError(null)}
                  className="inline-flex items-center justify-center rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !tokenLimitError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              <p className="font-medium">Error</p>
              <p>{error.message}</p>
              <button
                onClick={() => reload()}
                className="mt-2 text-red-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && messages.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-turquoise-500 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-turquoise-500 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-turquoise-500" />
              </div>
              <span className="text-sm">Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput
        input={input}
        setInput={setInput}
        handleSubmit={handleFormSubmit}
        isLoading={isLoading}
        attachments={attachments}
        setAttachments={setAttachments}
        onStop={stop}
        formRef={formRef}
      />
    </div>
  );
}
