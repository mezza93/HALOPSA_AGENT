'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Link2,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  RefreshCw,
  Star,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils/format';
import { AddConnectionModal } from './add-connection-modal';

interface Connection {
  id: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
  isDefault: boolean;
  testStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  lastTestedAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ConnectionsManagerProps {
  connections: Connection[];
}

export function ConnectionsManager({ connections: initialConnections }: ConnectionsManagerProps) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleTestConnection = async (connectionId: string) => {
    setTestingId(connectionId);

    try {
      const response = await fetch(`/api/halopsa/connections/${connectionId}/test`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Connection test failed');
      }

      toast.success('Connection test successful');
      router.refresh();
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setTestingId(null);
    }
  };

  const handleSetDefault = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/halopsa/connections/${connectionId}/default`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to set default connection');
      }

      toast.success('Default connection updated');
      router.refresh();
    } catch (error) {
      toast.error('Failed to set default connection');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    setDeletingId(connectionId);

    try {
      const response = await fetch(`/api/halopsa/connections/${connectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete connection');
      }

      setConnections(connections.filter((c) => c.id !== connectionId));
      toast.success('Connection deleted');
    } catch (error) {
      toast.error('Failed to delete connection');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status: Connection['testStatus']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'EXPIRED':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: Connection['testStatus']) => {
    switch (status) {
      case 'SUCCESS':
        return 'Connected';
      case 'FAILED':
        return 'Failed';
      case 'EXPIRED':
        return 'Expired';
      default:
        return 'Not tested';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Add connection button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>

      {/* Connections list */}
      {connections.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Link2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No connections yet</h3>
          <p className="mt-2 text-muted-foreground">
            Connect your first HaloPSA instance to get started
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="glass-card p-6 flex items-start justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-turquoise-100 dark:bg-turquoise-900/30">
                  <Link2 className="h-6 w-6 text-turquoise-600 dark:text-turquoise-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{connection.name}</h3>
                    {connection.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 px-2 py-0.5 text-xs font-medium text-turquoise-700 dark:text-turquoise-300">
                        <Star className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {connection.baseUrl}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(connection.testStatus)}
                      <span
                        className={
                          connection.testStatus === 'SUCCESS'
                            ? 'text-green-600 dark:text-green-400'
                            : connection.testStatus === 'FAILED'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground'
                        }
                      >
                        {getStatusText(connection.testStatus)}
                      </span>
                    </div>
                    {connection.lastUsedAt && (
                      <span className="text-muted-foreground">
                        Last used {formatRelativeTime(connection.lastUsedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestConnection(connection.id)}
                  disabled={testingId === connection.id}
                >
                  {testingId === connection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                {!connection.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(connection.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteConnection(connection.id)}
                  disabled={deletingId === connection.id}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {deletingId === connection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add connection modal */}
      <AddConnectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          router.refresh();
        }}
      />
    </div>
  );
}
