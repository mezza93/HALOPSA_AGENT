import { Suspense } from 'react';
import { RoadmapView } from '@/components/roadmap/roadmap-view';
import { LandingNav } from '@/components/landing/nav';
import { LandingFooter } from '@/components/landing/footer';

export const metadata = {
  title: 'Product Roadmap - HaloPSA AI',
  description: 'See what we are building and what is coming next for HaloPSA AI',
};

export default function PublicRoadmapPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingNav />
      <div className="pt-24">
        <Suspense fallback={<RoadmapSkeleton />}>
          <RoadmapView />
        </Suspense>
      </div>
      <LandingFooter />
    </main>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
