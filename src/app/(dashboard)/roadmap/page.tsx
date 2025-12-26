import { Suspense } from 'react';
import { RoadmapView } from '@/components/roadmap/roadmap-view';

export const metadata = {
  title: 'Roadmap',
  description: 'Product roadmap and upcoming features',
};

export default function RoadmapPage() {
  return (
    <Suspense fallback={<RoadmapSkeleton />}>
      <RoadmapView />
    </Suspense>
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
