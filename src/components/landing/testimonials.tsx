'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      "HaloPSA AI has completely transformed how our team handles tickets. What used to take 5 minutes of clicking around now takes 5 seconds with a simple question.",
    author: 'Sarah Mitchell',
    role: 'Service Desk Manager',
    company: 'TechStream Solutions',
    avatar: 'SM',
    rating: 5,
  },
  {
    quote:
      "The ability to query our PSA data naturally is a game-changer. Our technicians spend more time solving problems and less time navigating software.",
    author: 'James Rodriguez',
    role: 'IT Director',
    company: 'CloudFirst MSP',
    avatar: 'JR',
    rating: 5,
  },
  {
    quote:
      "We've reduced our average response time by 40% since implementing HaloPSA AI. The ROI was immediate and significant.",
    author: 'Emily Chen',
    role: 'Operations Lead',
    company: 'Nexus IT Services',
    avatar: 'EC',
    rating: 5,
  },
];

export function LandingTestimonials() {
  return (
    <section id="testimonials" className="relative py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-turquoise-50/20 to-transparent" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-block rounded-full bg-turquoise-100 px-4 py-2 text-sm font-medium text-turquoise-700"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
          >
            Loved by <span className="heading-gradient">MSPs</span> everywhere
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            See what IT professionals are saying about their experience with
            HaloPSA AI.
          </motion.p>
        </div>

        {/* Testimonials grid */}
        <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card relative p-6"
            >
              {/* Quote icon */}
              <Quote className="absolute top-4 right-4 h-8 w-8 text-turquoise-200" />

              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 text-foreground/90">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-turquoise-100 text-turquoise-600 font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
