/**
 * Notebook Loading Skeleton
 */

export default function NotebookLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-muted" />
          <div className="h-10 w-10 rounded-lg bg-muted" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
