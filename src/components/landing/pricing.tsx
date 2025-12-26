'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Free',
    description: 'Perfect for trying out HaloPSA AI',
    price: '$0',
    period: 'forever',
    features: [
      '100 AI queries per month',
      '1 HaloPSA connection',
      'Basic chat history (7 days)',
      'Community support',
    ],
    cta: 'Get Started',
    href: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For individual technicians and small teams',
    price: '$29',
    period: 'per month',
    features: [
      'Unlimited AI queries',
      '5 HaloPSA connections',
      'Unlimited chat history',
      'Image & file uploads',
      'Priority support',
      'Advanced analytics',
    ],
    cta: 'Start Pro Trial',
    href: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'For growing MSPs and agencies',
    price: 'Custom',
    period: 'per month',
    features: [
      'Everything in Pro',
      'Unlimited connections',
      'Team management',
      'SSO & SAML',
      'Audit logs',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    popular: false,
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block rounded-full bg-turquoise-100 px-4 py-2 text-sm font-medium text-turquoise-700"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Simple, <span className="heading-gradient">transparent</span> pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Start free, upgrade when you need more. No hidden fees, cancel
            anytime.
          </motion.p>
        </div>

        {/* Pricing grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card relative p-8 ${
                plan.popular
                  ? 'border-2 border-turquoise-500 shadow-glow'
                  : ''
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-turquoise-500 px-4 py-1 text-sm font-medium text-white">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-turquoise-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.href}>
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* FAQ link */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-muted-foreground"
        >
          Have questions?{' '}
          <Link
            href="/faq"
            className="text-turquoise-600 hover:underline"
          >
            Check our FAQ
          </Link>{' '}
          or{' '}
          <Link
            href="/contact"
            className="text-turquoise-600 hover:underline"
          >
            contact us
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
