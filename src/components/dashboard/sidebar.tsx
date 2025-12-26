'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Settings,
  Link2,
  History,
  Shield,
  HelpCircle,
  Sparkles,
  LogOut,
  BookOpen,
  Command,
  ChevronRight,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { SimpleTooltip, TooltipProvider } from '@/components/ui/tooltip';

interface SidebarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

const navigation = [
  { name: 'Chat', href: '/chat', icon: MessageSquare, shortcut: '1', description: 'AI-powered assistant' },
  { name: 'History', href: '/chat/history', icon: History, shortcut: '2', description: 'Past conversations' },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: BookOpen, shortcut: '3', description: 'HaloPSA configuration' },
  { name: 'Connections', href: '/settings/connections', icon: Link2, shortcut: '4', description: 'Manage API connections' },
  { name: 'Settings', href: '/settings', icon: Settings, shortcut: '5', description: 'Account preferences' },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield, description: 'System administration' },
];

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-gray-200 dark:border-gray-800 bg-background lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 dark:border-gray-800 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-turquoise-400 to-turquoise-600 shadow-lg shadow-turquoise-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">
              <span className="text-turquoise-600 dark:text-turquoise-400">Halo</span>
              <span className="text-foreground">PSA AI</span>
            </span>
            <p className="text-[10px] text-muted-foreground -mt-0.5">Intelligent Assistant</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4" role="navigation" aria-label="Main navigation">
          <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/chat' && pathname.startsWith(item.href + '/')) ||
              (item.href === '/chat' && pathname === '/chat');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300 shadow-sm'
                    : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-turquoise-500 rounded-r-full" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className="flex-1">{item.name}</span>
                {/* Keyboard shortcut hint */}
                <kbd className={cn(
                  "hidden group-hover:inline-flex h-5 min-w-[20px] items-center justify-center rounded border text-[10px] font-mono",
                  isActive
                    ? "border-turquoise-300 dark:border-turquoise-700 bg-turquoise-50 dark:bg-turquoise-900/50"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                )}>
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="my-4 border-t border-gray-200 dark:border-gray-800" />
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300 shadow-sm'
                        : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-turquoise-500 rounded-r-full" />
                    )}
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.name}</span>
                    <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Quick tips */}
        <div className="mx-4 mb-4 rounded-xl bg-gradient-to-br from-turquoise-50 to-turquoise-100 dark:from-turquoise-900/20 dark:to-turquoise-900/10 p-4 border border-turquoise-200 dark:border-turquoise-800">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-turquoise-500/20">
              <Command className="h-4 w-4 text-turquoise-600 dark:text-turquoise-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-turquoise-700 dark:text-turquoise-300">Pro Tip</p>
              <p className="text-xs text-turquoise-600/80 dark:text-turquoise-400/80 mt-0.5">
                Press number keys 1-5 to quickly navigate between sections.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <Link
            href="/help"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground transition-all group"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="flex-1">Help & Support</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>

          {/* User profile */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-100 dark:bg-gray-800/50 p-3 border border-gray-200 dark:border-gray-700">
            <Link href="/settings/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-10 w-10 rounded-full ring-2 ring-white dark:ring-gray-800"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-turquoise-400 to-turquoise-600 text-white font-medium ring-2 ring-white dark:ring-gray-800">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name || 'User'}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </Link>
            <SimpleTooltip content="Sign out" side="top">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg p-2 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </SimpleTooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
