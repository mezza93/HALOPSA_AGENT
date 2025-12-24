'use client';

export function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Welcome skeleton */}
          <div className="flex flex-col items-center py-12">
            <div className="mb-6 h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mb-2 h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-8 h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="h-14 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
