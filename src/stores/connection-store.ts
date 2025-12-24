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
  setConnections: (connections: HaloConnection[]) => void;
  setActiveConnection: (connection: HaloConnection | null) => void;
  addConnection: (connection: HaloConnection) => void;
  removeConnection: (id: string) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnection: null,

      setConnections: (connections) => {
        set({ connections });
        // Set first active connection as default
        const active = connections.find((c) => c.isActive);
        if (active && !get().activeConnection) {
          set({ activeConnection: active });
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
    }),
    {
      name: 'halopsa-connections',
      partialize: (state) => ({
        activeConnection: state.activeConnection
          ? { id: state.activeConnection.id }
          : null,
      }),
    }
  )
);
