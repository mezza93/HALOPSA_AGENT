'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const demoQueries = [
  'Show me all P1 tickets created this week',
  'Which technician has the most open tickets?',
  'Create a ticket for client ABC about email issues',
  'What\'s our SLA performance for the last 30 days?',
  'List all assets with expiring warranties',
];

export function LandingDemo() {
  const [activeQuery, setActiveQuery] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section id="demo" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 px-4 py-2 text-sm font-medium text-turquoise-700 dark:text-turquoise-300"
          >
            See it in action
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Watch the <span className="heading-gradient">magic</span> happen
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            See how HaloPSA AI transforms your daily workflow with natural
            language interactions.
          </motion.p>
        </div>

        {/* Demo video container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-12 max-w-5xl"
        >
          <div className="glass-card overflow-hidden">
            {/* Video placeholder */}
            <div className="relative aspect-video bg-gray-900">
              {/* Placeholder for actual video */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-turquoise-900/50 to-cyan-900/50">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white/80">Demo video coming soon</p>
                </div>
              </div>

              {/* Video controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="rounded-full bg-white/20 p-2 hover:bg-white/30"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 text-white" />
                      ) : (
                        <Play className="h-5 w-5 text-white" />
                      )}
                    </button>
                    <div className="h-1 w-48 rounded-full bg-white/30">
                      <div className="h-full w-1/3 rounded-full bg-turquoise-500" />
                    </div>
                    <span className="text-sm text-white/80">1:23 / 3:45</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                      <Volume2 className="h-5 w-5 text-white" />
                    </button>
                    <button className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Example queries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <h3 className="mb-6 text-center text-lg font-semibold">
            Try these example queries
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {demoQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setActiveQuery(index)}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  activeQuery === index
                    ? 'bg-turquoise-500 text-white shadow-glow-sm'
                    : 'bg-white dark:bg-gray-800 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                "{query}"
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
