'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, Search, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface HeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardHeader({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/chat') return 'Chat';
    if (pathname.startsWith('/chat/history')) return 'Chat History';
    if (pathname.startsWith('/settings/connections')) return 'Connections';
    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/admin')) return 'Admin';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Mobile menu button */}
        <div className="flex items-center gap-4 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          <Link href="/chat" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-turquoise-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </Link>
        </div>

        {/* Page title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-5 w-5" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-turquoise-500" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden border-t border-gray-200 dark:border-gray-800 bg-background',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <nav className="p-4 space-y-2">
          {[
            { name: 'Chat', href: '/chat' },
            { name: 'History', href: '/chat/history' },
            { name: 'Connections', href: '/settings/connections' },
            { name: 'Settings', href: '/settings' },
          ].map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block rounded-xl px-4 py-3 text-sm font-medium transition-all',
                pathname === item.href
                  ? 'bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-700 dark:text-turquoise-300'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
