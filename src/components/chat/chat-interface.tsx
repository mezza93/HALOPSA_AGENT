'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from 'ai/react';
import { toast } from 'sonner';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatHeader } from './chat-header';
import { ChatWelcome } from './chat-welcome';
import { useConnectionStore } from '@/stores/connection-store';

interface ChatInterfaceProps {
  userId: string;
  sessionId?: string;
}

export function ChatInterface({ userId, sessionId }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const { activeConnection, initialize, isLoading: isLoadingConnection } = useConnectionStore();

  // Initialize connection store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

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
    },
    onError: (err) => {
      console.error('Chat error:', err);
      toast.error('Failed to send message. Please try again.');
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

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <ChatHeader
        connectionName={activeConnection?.name}
        onClear={() => window.location.reload()}
        isLoading={isLoading}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
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

          {/* Error state */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
              <p className="font-medium">Error</p>
              <p>{error.message}</p>
              <button
                onClick={() => reload()}
                className="mt-2 text-red-700 dark:text-red-300 underline"
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
      />
    </div>
  );
}
