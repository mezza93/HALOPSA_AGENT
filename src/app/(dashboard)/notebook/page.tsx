import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NotebookView } from '@/components/notebook/notebook-view';
import { prisma } from '@/lib/db';

export const metadata = {
  title: 'Notebook',
  description: 'Your saved notes and findings from AI conversations',
};

async function getNotebookData(userId: string) {
  const [entriesRaw, memoriesRaw] = await Promise.all([
    prisma.notebookEntry.findMany({
      where: { userId, isArchived: false },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.conversationMemory.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: 'desc' },
      take: 20,
    }),
  ]);

  // Transform dates to strings
  const entries = entriesRaw.map((entry) => ({
    id: entry.id,
    title: entry.title,
    content: entry.content,
    category: entry.category,
    tags: entry.tags,
    relatedEntities: entry.relatedEntities as Array<{ type: string; id: string; name: string }> | null,
    sessionId: entry.sessionId,
    isPinned: entry.isPinned,
    color: entry.color,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  }));

  const memories = memoriesRaw.map((memory) => ({
    id: memory.id,
    entityType: memory.entityType,
    entityId: memory.entityId,
    entityName: memory.entityName,
    summary: memory.summary,
    keyFacts: memory.keyFacts as Record<string, unknown> | null,
    sentiment: memory.sentiment,
    importance: memory.importance,
    lastAccessedAt: memory.lastAccessedAt.toISOString(),
  }));

  return { entries, memories };
}

export default async function NotebookPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { entries, memories } = await getNotebookData(session.user.id);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <NotebookView
          entries={entries}
          memories={memories}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
