/**
 * Dashboard Loading Skeleton
 * Shows immediately while page content loads
 */

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-9 w-9 rounded-lg bg-muted" />
          <div className="h-9 w-9 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 p-6">
        <div className="space-y-4">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
          <div className="mt-6 h-64 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
