'use client';

import { Sparkles, Ticket, HardDrive } from 'lucide-react';

interface ChatWelcomeProps {
  onQuickAction: (action: string) => void;
}

const quickActions = [
  {
    icon: Ticket,
    title: 'View Tickets',
    description: 'Show me open tickets',
    action: 'Show me all open tickets',
  },
  {
    icon: HardDrive,
    title: 'Asset Check',
    description: 'Expiring warranties',
    action: 'List all assets with warranties expiring in the next 30 days',
  },
];

export function ChatWelcome({ onQuickAction }: ChatWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Welcome icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-turquoise-100">
        <Sparkles className="h-10 w-10 text-turquoise-500" />
      </div>

      {/* Welcome text */}
      <h2 className="mb-2 text-2xl font-bold">Welcome to HaloPSA AI</h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        Ask me anything about your HaloPSA data. I can help you with tickets,
        clients, assets, reports, and more.
      </p>

      {/* Quick actions */}
      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onQuickAction(action.action)}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-turquoise-300 hover:shadow-glow-sm"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-turquoise-100 text-turquoise-600 transition-all group-hover:scale-110">
              <action.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{action.title}</h3>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Example queries */}
      <div className="mt-8 text-center">
        <p className="mb-3 text-sm text-muted-foreground">Or try asking:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'Who has the most open tickets?',
            'Show P1 tickets from this week',
            'Create a ticket for client ABC',
          ].map((query, index) => (
            <button
              key={index}
              onClick={() => onQuickAction(query)}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-turquoise-100 hover:text-turquoise-700"
            >
              "{query}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
