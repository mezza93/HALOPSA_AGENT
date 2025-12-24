import { LandingHero } from '@/components/landing/hero';
import { LandingFeatures } from '@/components/landing/features';
import { LandingDemo } from '@/components/landing/demo';
import { LandingPricing } from '@/components/landing/pricing';
import { LandingTestimonials } from '@/components/landing/testimonials';
import { LandingCTA } from '@/components/landing/cta';
import { LandingFooter } from '@/components/landing/footer';
import { LandingNav } from '@/components/landing/nav';

export default function LandingPage() {
  return (
    <main className="relative">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingDemo />
      <LandingTestimonials />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </main>
  );
}
