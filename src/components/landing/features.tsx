'use client';

import { motion } from 'framer-motion';
import {
  MessageSquare,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Users,
  FileText,
  Database,
  Bot,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Natural Language Queries',
    description:
      'Ask questions in plain English. No need to learn complex query languages or navigate endless menus.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Actions',
    description:
      'Create tickets, update statuses, and manage clients through simple conversations with your AI assistant.',
  },
  {
    icon: BarChart3,
    title: 'Instant Insights',
    description:
      'Get real-time analytics on ticket trends, SLA performance, and team workload in seconds.',
  },
  {
    icon: Database,
    title: 'Multi-Instance Support',
    description:
      'Connect to multiple HaloPSA instances. Perfect for MSPs managing different client environments.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Your credentials are encrypted at rest. SOC 2 compliant infrastructure with zero data retention.',
  },
  {
    icon: Clock,
    title: 'Chat History',
    description:
      'Never lose context. Your conversation history is saved and searchable across all sessions.',
  },
  {
    icon: FileText,
    title: 'Image & File Support',
    description:
      'Upload screenshots and documents. The AI analyzes images to understand context better.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Share insights with your team. Admin controls let you manage access and usage.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Responses in seconds, not minutes. Optimized for performance even with large datasets.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-turquoise-50/30 dark:via-turquoise-950/20 to-transparent" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block rounded-full bg-turquoise-100 dark:bg-turquoise-900/30 px-4 py-2 text-sm font-medium text-turquoise-700 dark:text-turquoise-300"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Everything you need to{' '}
            <span className="heading-gradient">supercharge</span> your PSA
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Built specifically for IT professionals who want to spend less time
            navigating menus and more time solving problems.
          </motion.p>
        </div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass-card group p-6 transition-all duration-300 hover:shadow-glow-sm"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-turquoise-100 dark:bg-turquoise-900/30 text-turquoise-600 dark:text-turquoise-400 transition-all group-hover:scale-110 group-hover:shadow-glow-sm">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
