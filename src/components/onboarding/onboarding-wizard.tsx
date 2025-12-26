'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles,
  Link2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingWizardProps {
  userId: string;
  userName?: string | null;
}

type Step = 'welcome' | 'connect' | 'test' | 'complete';

export function OnboardingWizard({ userId, userName }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Connection form state
  const [connectionName, setConnectionName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [tenant, setTenant] = useState('');

  const steps: { id: Step; title: string }[] = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'connect', title: 'Connect' },
    { id: 'test', title: 'Verify' },
    { id: 'complete', title: 'Complete' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

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
        const data = await response.json();
        throw new Error(data.error || 'Connection test failed');
      }

      setTestStatus('success');
      toast.success('Connection successful!');
    } catch (error) {
      setTestStatus('error');
      toast.error(error instanceof Error ? error.message : 'Connection test failed');
    }
  };

  const handleSaveConnection = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/halopsa/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: connectionName,
          baseUrl,
          clientId,
          clientSecret,
          tenant: tenant || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save connection');
      }

      setCurrentStep('complete');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/chat');
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  index < currentStepIndex
                    ? 'border-turquoise-500 bg-turquoise-500 text-white'
                    : index === currentStepIndex
                    ? 'border-turquoise-500 text-turquoise-500'
                    : 'border-gray-300 text-gray-400'
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 w-16 sm:w-24 mx-2 rounded ${
                    index < currentStepIndex
                      ? 'bg-turquoise-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {steps.map((step) => (
            <span key={step.id} className="w-10 text-center">
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-8"
        >
          {/* Welcome Step */}
          {currentStep === 'welcome' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-turquoise-100">
                <Sparkles className="h-10 w-10 text-turquoise-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">
                Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
              </h1>
              <p className="mb-6 text-muted-foreground">
                Let's get you set up with HaloPSA AI. We'll connect to your
                HaloPSA instance so you can start managing tickets, clients, and
                more with natural language.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-turquoise-500" />
                  <div>
                    <p className="font-medium">Quick Setup</p>
                    <p className="text-sm text-muted-foreground">
                      Connect in under 2 minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-turquoise-500" />
                  <div>
                    <p className="font-medium">Secure Connection</p>
                    <p className="text-sm text-muted-foreground">
                      Your credentials are encrypted at rest
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-turquoise-500" />
                  <div>
                    <p className="font-medium">Read-Only by Default</p>
                    <p className="text-sm text-muted-foreground">
                      Start with read access, enable write when ready
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setCurrentStep('connect')}
                className="mt-8 w-full"
                size="lg"
              >
                Let's Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Connect Step */}
          {currentStep === 'connect' && (
            <div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-turquoise-100">
                  <Link2 className="h-6 w-6 text-turquoise-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connect to HaloPSA</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter your API credentials
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Need help?</strong> Follow our{' '}
                  <a
                    href="/docs/halopsa-setup"
                    target="_blank"
                    className="underline"
                  >
                    setup guide
                  </a>{' '}
                  to create API credentials in HaloPSA.
                </p>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Connection Name
                  </label>
                  <input
                    type="text"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    placeholder="My Company HaloPSA"
                    className="input-field"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    A friendly name to identify this connection
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    HaloPSA URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://your-company.halopsa.com"
                    className="input-field"
                    required
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
                    placeholder="Enter your API Client ID"
                    className="input-field"
                    required
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
                    placeholder="Enter your API Client Secret"
                    className="input-field"
                    required
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
                    placeholder="For hosted solutions only"
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only required for HaloPSA hosted solutions
                  </p>
                </div>
              </form>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('welcome')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setCurrentStep('test')}
                  disabled={!connectionName || !baseUrl || !clientId || !clientSecret}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Test Step */}
          {currentStep === 'test' && (
            <div className="text-center">
              <div className="mb-6">
                {testStatus === 'idle' && (
                  <>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                      <Link2 className="h-10 w-10 text-gray-400" />
                    </div>
                    <h2 className="text-xl font-bold">Test Your Connection</h2>
                    <p className="mt-2 text-muted-foreground">
                      Let's verify your credentials work correctly
                    </p>
                  </>
                )}

                {testStatus === 'testing' && (
                  <>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-turquoise-100">
                      <Loader2 className="h-10 w-10 animate-spin text-turquoise-500" />
                    </div>
                    <h2 className="text-xl font-bold">Testing Connection...</h2>
                    <p className="mt-2 text-muted-foreground">
                      Connecting to {baseUrl}
                    </p>
                  </>
                )}

                {testStatus === 'success' && (
                  <>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold">Connection Successful!</h2>
                    <p className="mt-2 text-muted-foreground">
                      Your HaloPSA instance is ready to use
                    </p>
                  </>
                )}

                {testStatus === 'error' && (
                  <>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                      <span className="text-3xl">❌</span>
                    </div>
                    <h2 className="text-xl font-bold">Connection Failed</h2>
                    <p className="mt-2 text-muted-foreground">
                      Please check your credentials and try again
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-lg bg-gray-50 p-4 text-left">
                <p className="text-sm font-medium">Connection Details</p>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name:</dt>
                    <dd>{connectionName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">URL:</dt>
                    <dd className="truncate max-w-[200px]">{baseUrl}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('connect')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {testStatus === 'success' ? (
                  <Button
                    className="flex-1"
                    onClick={handleSaveConnection}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Save & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : testStatus === 'error' ? (
                      'Try Again'
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-turquoise-100">
                <Sparkles className="h-10 w-10 text-turquoise-500" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">You're All Set!</h2>
              <p className="mb-6 text-muted-foreground">
                Your HaloPSA connection is ready. Start chatting with your AI
                assistant to manage tickets, view clients, and more.
              </p>

              <div className="space-y-3 text-left mb-6">
                <p className="font-medium">Try asking:</p>
                <div className="space-y-2">
                  {[
                    'Show me all open tickets',
                    'List clients with the most tickets',
                    "What's our SLA performance this month?",
                  ].map((query, index) => (
                    <div
                      key={index}
                      className="rounded-lg bg-gray-50 px-4 py-2 text-sm"
                    >
                      "{query}"
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleComplete} className="w-full" size="lg">
                Start Chatting
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
