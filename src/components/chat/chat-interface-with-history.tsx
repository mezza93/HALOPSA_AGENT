'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat, type Message } from 'ai/react';
import { toast } from 'sonner';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ChatHeader } from './chat-header';
import { OptionCards } from './option-cards';
import { useRouter } from 'next/navigation';

interface ChatInterfaceWithHistoryProps {
  userId: string;
  sessionId: string;
  initialMessages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
  }>;
  connectionId?: string;
  connectionName?: string;
}

export function ChatInterfaceWithHistory({
  userId,
  sessionId,
  initialMessages,
  connectionId,
  connectionName,
}: ChatInterfaceWithHistoryProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Convert initial messages to the format expected by useChat
  const formattedInitialMessages: Message[] = initialMessages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }));

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
    id: sessionId,
    initialMessages: formattedInitialMessages,
    body: {
      connectionId,
      sessionId,
    },
    onError: (err) => {
      console.error('Chat error:', err);
      let errorMessage = 'Failed to send message. Please try again.';
      if (err.message) {
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

  // Handle option card selection
  const handleOptionSelect = (option: string) => {
    setInput(option);
    // Auto-submit after a short delay to show the selection
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

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
        connectionName={connectionName}
        onClear={() => router.push('/chat')}
        isLoading={isLoading}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 relative z-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLoading={isLoading && message === messages[messages.length - 1]}
            />
          ))}

          {/* Option cards */}
          {options && !isLoading && (
            <OptionCards
              options={options}
              onSelect={handleOptionSelect}
            />
          )}

          {/* Error state */}
          {error && (
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
      />
    </div>
  );
}
