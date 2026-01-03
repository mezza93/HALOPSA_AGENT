/**
 * Settings Loading Skeleton
 */

export default function SettingsLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-28 rounded-lg bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b pb-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 rounded-lg bg-muted" />
        ))}
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <div className="h-6 w-24 rounded bg-muted mb-4" />
          <div className="space-y-4">
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="h-6 w-32 rounded bg-muted mb-4" />
          <div className="space-y-3">
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-16 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
