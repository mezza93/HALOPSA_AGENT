/**
 * Chat History Loading Skeleton
 */

export default function ChatHistoryLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
