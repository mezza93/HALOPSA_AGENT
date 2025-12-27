'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ChevronDown, Check, Plus, Settings, RefreshCw } from 'lucide-react';
import { useConnectionStore } from '@/stores/connection-store';
import { cn } from '@/lib/utils/cn';

export function ConnectionSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    connections,
    activeConnection,
    isLoading,
    setActiveConnection,
    fetchConnections,
    initialize,
  } = useConnectionStore();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectConnection = async (connection: typeof activeConnection) => {
    if (connection?.id === activeConnection?.id) {
      setIsOpen(false);
      return;
    }

    // Set as default via API
    try {
      const response = await fetch(`/api/halopsa/connections/${connection?.id}/default`, {
        method: 'POST',
      });

      if (response.ok) {
        setActiveConnection(connection);
        await fetchConnections();
      }
    } catch (error) {
      console.error('Failed to switch connection:', error);
    }

    setIsOpen(false);
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await fetchConnections();
  };

  // Don't show if no connections
  if (!isLoading && connections.length === 0) {
    return (
      <button
        onClick={() => router.push('/settings/connections')}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-500 hover:border-turquoise-500 hover:text-turquoise-600 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Connection</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
          activeConnection
            ? 'border-turquoise-200 bg-turquoise-50 text-turquoise-700 hover:bg-turquoise-100'
            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
        )}
      >
        <Zap className={cn(
          'h-4 w-4',
          activeConnection ? 'text-turquoise-500' : 'text-gray-400'
        )} />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {isLoading ? 'Loading...' : activeConnection?.name || 'No Connection'}
        </span>
        <ChevronDown className={cn(
          'h-4 w-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Connections
            </span>
            <button
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              title="Refresh connections"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </button>
          </div>

          {/* Connection list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {connections.map((connection) => (
              <button
                key={connection.id}
                onClick={() => handleSelectConnection(connection)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors',
                  activeConnection?.id === connection.id && 'bg-turquoise-50'
                )}
              >
                <Zap className={cn(
                  'h-4 w-4 flex-shrink-0',
                  connection.isActive ? 'text-turquoise-500' : 'text-gray-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{connection.name}</div>
                  <div className="text-xs text-gray-400 truncate">{connection.baseUrl}</div>
                </div>
                {activeConnection?.id === connection.id && (
                  <Check className="h-4 w-4 text-turquoise-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/settings/connections');
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Manage Connections
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
