/**
 * Opportunities Loading Skeleton
 */

export default function OpportunitiesLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-lg bg-muted" />
          <div className="h-4 w-80 rounded bg-muted" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-muted" />
      </div>

      {/* Stats cards */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>

        {/* Opportunity cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
