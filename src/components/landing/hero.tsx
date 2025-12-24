'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Shield, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-20">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-hero-gradient opacity-50" />
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-turquoise-500/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 px-4 py-2 text-sm font-medium text-turquoise-700 dark:text-turquoise-300"
          >
            <Sparkles className="h-4 w-4" />
            Powered by Claude AI
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="text-foreground">Your AI Assistant for</span>
            <br />
            <span className="heading-gradient">HaloPSA</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          >
            Manage tickets, query data, and automate tasks using natural language.
            Built for IT Managed Service Providers who want to work smarter.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register">
              <Button size="lg" className="group h-14 px-8 text-lg shadow-glow">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                Watch Demo
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {[
              { value: '10x', label: 'Faster Ticket Resolution' },
              { value: '500+', label: 'MSPs Using Daily' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'AI Availability' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-turquoise-600 dark:text-turquoise-400 sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Hero Image / Chat Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mx-auto mt-20 max-w-5xl"
        >
          <div className="glass-card overflow-hidden p-1">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-1.5 text-sm text-muted-foreground">
                halopsa.ai/chat
              </div>
            </div>

            {/* Chat preview */}
            <div className="bg-background/50 p-6">
              <div className="space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="chat-message-user max-w-md">
                    Show me all open tickets assigned to the network team with
                    priority P1 or P2
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="chat-message-assistant max-w-2xl">
                    <div className="mb-3 flex items-center gap-2 text-sm text-turquoise-600 dark:text-turquoise-400">
                      <Sparkles className="h-4 w-4" />
                      Querying HaloPSA...
                    </div>
                    <p className="mb-3">
                      Found <strong>12 high-priority tickets</strong> for the
                      Network Team:
                    </p>
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">
                              ID
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Subject
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              Priority
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                              SLA
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 text-turquoise-600 dark:text-turquoise-400">
                              #4521
                            </td>
                            <td className="px-3 py-2">Core switch failure</td>
                            <td className="px-3 py-2">
                              <span className="rounded bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs text-red-700 dark:text-red-400">
                                P1
                              </span>
                            </td>
                            <td className="px-3 py-2 text-red-600">
                              Breached
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2 text-turquoise-600 dark:text-turquoise-400">
                              #4518
                            </td>
                            <td className="px-3 py-2">VPN connectivity issues</td>
                            <td className="px-3 py-2">
                              <span className="rounded bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 text-xs text-orange-700 dark:text-orange-400">
                                P2
                              </span>
                            </td>
                            <td className="px-3 py-2 text-yellow-600">
                              At Risk
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 flex flex-wrap justify-center gap-4"
        >
          {[
            { icon: MessageSquare, label: 'Natural Language' },
            { icon: Zap, label: 'Real-time Data' },
            { icon: Shield, label: 'Enterprise Security' },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-full bg-white/50 dark:bg-gray-800/50 px-4 py-2 text-sm"
            >
              <feature.icon className="h-4 w-4 text-turquoise-500" />
              {feature.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
