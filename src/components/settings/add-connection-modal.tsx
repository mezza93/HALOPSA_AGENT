'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddConnectionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddConnectionModal({
  open,
  onClose,
  onSuccess,
}: AddConnectionModalProps) {
  const [step, setStep] = useState<'form' | 'test' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Form state
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tenant, setTenant] = useState('');

  const resetForm = () => {
    setStep('form');
    setTestStatus('idle');
    setName('');
    setBaseUrl('');
    setClientId('');
    setClientSecret('');
    setTenant('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');

    try {
      const response = await fetch('/api/halopsa/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          clientId,
          clientSecret,
          tenant: tenant || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Connection test failed');
      }

      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
      toast.error('Connection test failed');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/halopsa/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          baseUrl,
          clientId,
          clientSecret,
          tenant: tenant || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save connection');
      }

      toast.success('Connection added successfully');
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error('Failed to save connection');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 glass-card p-6 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Connection</h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Company HaloPSA"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              HaloPSA URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://company.halopsa.com"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="API Client ID"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="API Client Secret"
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tenant (Optional)
            </label>
            <input
              type="text"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              placeholder="For hosted solutions"
              className="input-field"
            />
          </div>

          {/* Test status */}
          {testStatus === 'success' && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              Connection test successful
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
              Connection test failed. Please check your credentials.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          {testStatus === 'success' ? (
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Connection'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleTestConnection}
              disabled={!name || !baseUrl || !clientId || !clientSecret || testStatus === 'testing'}
              className="flex-1"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
