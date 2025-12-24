'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingCTA() {
  return (
    <section className="relative py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-turquoise-600 to-cyan-600 opacity-90" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4" />
            Ready to transform your workflow?
          </div>

          <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Start using HaloPSA AI today
          </h2>

          <p className="mb-10 text-lg text-white/80">
            Join hundreds of MSPs who are already saving hours every week with
            AI-powered PSA management. No credit card required.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="xl"
                className="group bg-white text-turquoise-600 hover:bg-gray-100"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="xl"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-white/60">
            <span className="text-sm">Trusted by 500+ MSPs</span>
            <span className="text-sm">SOC 2 Compliant</span>
            <span className="text-sm">99.9% Uptime</span>
            <span className="text-sm">GDPR Ready</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
