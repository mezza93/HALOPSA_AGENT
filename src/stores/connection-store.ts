/**
 * Zustand store for managing HaloPSA connection state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface HaloConnection {
  id: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
}

interface ConnectionState {
  connections: HaloConnection[];
  activeConnection: HaloConnection | null;
  isLoading: boolean;
  isInitialized: boolean;
  setConnections: (connections: HaloConnection[]) => void;
  setActiveConnection: (connection: HaloConnection | null) => void;
  addConnection: (connection: HaloConnection) => void;
  removeConnection: (id: string) => void;
  fetchConnections: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnection: null,
      isLoading: false,
      isInitialized: false,

      setConnections: (connections) => {
        set({ connections });
        // Set first active connection as default if none selected
        const current = get().activeConnection;
        if (!current || !connections.find(c => c.id === current.id)) {
          const active = connections.find((c) => c.isActive);
          if (active) {
            set({ activeConnection: active });
          }
        }
      },

      setActiveConnection: (connection) => {
        set({ activeConnection: connection });
      },

      addConnection: (connection) => {
        set((state) => ({
          connections: [...state.connections, connection],
        }));
      },

      removeConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeConnection:
            state.activeConnection?.id === id
              ? null
              : state.activeConnection,
        }));
      },

      fetchConnections: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch('/api/halopsa/connections');
          if (response.ok) {
            const data = await response.json();
            // API returns array directly
            const rawConnections = Array.isArray(data) ? data : (data.connections || []);
            const connections = rawConnections.map((c: { id: string; name: string; baseUrl: string; isActive: boolean }) => ({
              id: c.id,
              name: c.name,
              baseUrl: c.baseUrl,
              isActive: c.isActive,
            }));
            get().setConnections(connections);
          }
        } catch (error) {
          console.error('Failed to fetch connections:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        if (get().isInitialized) return;

        set({ isInitialized: true });
        await get().fetchConnections();
      },
    }),
    {
      name: 'halopsa-connections',
      partialize: (state) => ({
        // Persist the full activeConnection object
        activeConnection: state.activeConnection,
      }),
    }
  )
);
