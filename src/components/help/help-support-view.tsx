'use client';

import { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  Loader2,
  BookOpen,
  Mail,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot,
  User,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface HelpSupportViewProps {
  userId: string;
  userName?: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const faqItems = [
  {
    question: 'How do I connect to HaloPSA?',
    answer: 'Go to Settings > Connections, click "Add Connection", and enter your HaloPSA API credentials. You\'ll need your HaloPSA URL, Client ID, and Client Secret.',
  },
  {
    question: 'What can the AI assistant do?',
    answer: 'The AI assistant can help you query tickets, manage clients, view assets, generate reports, and perform many other HaloPSA operations using natural language.',
  },
  {
    question: 'How do I sync my knowledge base?',
    answer: 'Navigate to the Knowledge Base section and click "Sync from HaloPSA". This will import your ticket types, statuses, categories, and other configuration data.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes! Your HaloPSA credentials are encrypted at rest, and we never store your actual ticket or client data. All API calls are made in real-time.',
  },
];

const resourceLinks = [
  {
    title: 'Documentation',
    description: 'Learn how to use HaloPSA AI',
    icon: BookOpen,
    href: '/docs',
  },
  {
    title: 'Contact Support',
    description: 'Email our support team',
    icon: Mail,
    href: 'mailto:support@halopsa.ai',
  },
  {
    title: 'HaloPSA Docs',
    description: 'Official HaloPSA documentation',
    icon: ExternalLink,
    href: 'https://halopsa.com/docs',
    external: true,
  },
];

const suggestedQuestions = [
  'How do I create a ticket using the AI?',
  'Can I export data from HaloPSA AI?',
  'How do I add team members?',
  'What\'s the difference between Pro and Enterprise?',
];

export function HelpSupportView({ userId, userName }: HelpSupportViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi${userName ? `, ${userName.split(' ')[0]}` : ''}! I'm your AI support assistant. How can I help you today? You can ask me anything about HaloPSA AI, and I'll do my best to help.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'faq' | 'resources'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (in production, this would call an API)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      const responses: Record<string, string> = {
        'create': 'To create a ticket, simply tell the AI assistant in the Chat what you want to create. For example, say "Create a P2 ticket for client ABC about email issues" and the AI will help you through the process.',
        'export': 'Currently, HaloPSA AI displays data in real-time from your HaloPSA instance. For data exports, you can use the HaloPSA reporting features directly, or ask the AI to help you generate specific reports.',
        'team': 'Team management is available on the Pro and Enterprise plans. Go to Settings > Team to invite members. Each member will need their own HaloPSA AI account.',
        'pro': 'The Pro plan includes unlimited AI queries, 5 HaloPSA connections, and priority support. Enterprise adds unlimited connections, SSO/SAML, audit logs, and dedicated support. Check our Pricing page for full details.',
        'connect': 'To connect to HaloPSA: 1) Go to Settings > Connections, 2) Click "Add Connection", 3) Enter your HaloPSA URL (e.g., company.halopsa.com), 4) Add your Client ID and Client Secret from HaloPSA, 5) Click "Test & Save".',
        'knowledge': 'The Knowledge Base syncs your HaloPSA configuration (ticket types, statuses, priorities, etc.) so the AI understands your setup. Go to Knowledge Base and click "Sync from HaloPSA" to update it.',
      };

      let response = "I'm here to help! Could you tell me more about what you're trying to do? I can assist with:\n\n• Connecting to HaloPSA\n• Using the AI assistant\n• Account settings and billing\n• Technical issues\n• Feature questions";

      const lowerInput = userMessage.content.toLowerCase();
      for (const [key, value] of Object.entries(responses)) {
        if (lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Hi${userName ? `, ${userName.split(' ')[0]}` : ''}! I'm your AI support assistant. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-gray-50/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="h-5 w-5 text-turquoise-600" />
            <h1 className="text-lg font-semibold">Help & Support</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Get help from our AI or browse resources
          </p>
        </div>

        {/* Tab navigation */}
        <nav className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
              activeTab === 'chat'
                ? 'bg-turquoise-100 text-turquoise-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Bot className="h-4 w-4" />
            <span>AI Support</span>
            <span className="ml-auto text-xs bg-turquoise-500 text-white px-1.5 py-0.5 rounded">
              Live
            </span>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
              activeTab === 'faq'
                ? 'bg-turquoise-100 text-turquoise-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <MessageSquare className="h-4 w-4" />
            <span>FAQs</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={cn(
              'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-all',
              activeTab === 'resources'
                ? 'bg-turquoise-100 text-turquoise-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <BookOpen className="h-4 w-4" />
            <span>Resources</span>
          </button>
        </nav>

        {/* Quick help */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="rounded-xl bg-gradient-to-br from-turquoise-50 to-turquoise-100 p-4 border border-turquoise-200">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-turquoise-500/20">
                <Sparkles className="h-4 w-4 text-turquoise-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-turquoise-700">AI-Powered</p>
                <p className="text-xs text-turquoise-600/80 mt-0.5">
                  Our AI support is available 24/7 to help you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* AI Chat Tab */}
        {activeTab === 'chat' && (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-turquoise-100">
                  <Bot className="h-5 w-5 text-turquoise-600" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
                </div>
                <div>
                  <p className="font-medium">AI Support Agent</p>
                  <p className="text-xs text-muted-foreground">Always online</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleNewConversation}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                New Chat
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mx-auto max-w-2xl space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        message.role === 'user'
                          ? 'bg-gray-200'
                          : 'bg-turquoise-100'
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-turquoise-600" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'max-w-md rounded-2xl px-4 py-3',
                        message.role === 'user'
                          ? 'bg-turquoise-500 text-white rounded-tr-sm'
                          : 'bg-gray-100 rounded-tl-sm'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise-100">
                      <Bot className="h-4 w-4 text-turquoise-600" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Suggested questions */}
            {messages.length === 1 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="rounded-full bg-gray-100 px-3 py-1.5 text-xs text-muted-foreground hover:bg-turquoise-100 hover:text-turquoise-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    placeholder="Ask anything about HaloPSA AI..."
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise-500"
                    rows={1}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 h-8 w-8"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 p-4 hover:border-turquoise-300 transition-colors"
                  >
                    <h3 className="font-medium mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Can't find what you're looking for?
                </p>
                <Button onClick={() => setActiveTab('chat')}>
                  <Bot className="h-4 w-4 mr-2" />
                  Ask AI Support
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-xl font-semibold mb-6">Resources & Links</h2>
              <div className="grid gap-4">
                {resourceLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 hover:border-turquoise-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-turquoise-100 text-turquoise-600 group-hover:scale-110 transition-transform">
                      <link.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{link.title}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-turquoise-500 transition-colors" />
                  </a>
                ))}
              </div>

              {/* Contact form teaser */}
              <div className="mt-8 rounded-xl bg-gradient-to-br from-turquoise-50 to-cyan-50 border border-turquoise-200 p-6">
                <h3 className="font-semibold mb-2">Need more help?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our AI support is the fastest way to get help, but you can also reach our
                  team directly for complex issues.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setActiveTab('chat')}>
                    <Bot className="h-4 w-4 mr-2" />
                    Chat with AI
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:support@halopsa.ai">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
