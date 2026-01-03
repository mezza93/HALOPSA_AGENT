/**
 * Knowledge Base Loading Skeleton
 */

export default function KnowledgeBaseLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg bg-muted" />
          <div className="h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-10 w-28 rounded-lg bg-muted" />
      </div>

      {/* Tabs skeleton */}
      <div className="border-b px-6">
        <div className="flex gap-6 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-20 rounded bg-muted" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
