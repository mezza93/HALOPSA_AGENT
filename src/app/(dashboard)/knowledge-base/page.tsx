import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { KnowledgeBaseView } from '@/components/knowledge-base/knowledge-base-view';
import { prisma } from '@/lib/db';

export const metadata = {
  title: 'Knowledge Base',
  description: 'View and manage your HaloPSA knowledge base',
};

async function getKnowledgeBaseData(userId: string) {
  const [kbItemsRaw, syncStatusRaw] = await Promise.all([
    prisma.knowledgeBaseItem.findMany({
      where: { userId },
      orderBy: [
        { category: 'asc' },
        { updatedAt: 'desc' },
      ],
    }),
    prisma.knowledgeBaseSync.findFirst({
      where: { userId },
      orderBy: { syncedAt: 'desc' },
    }),
  ]);

  // Transform dates to strings for the component
  const kbItems = kbItemsRaw.map((item) => ({
    id: item.id,
    category: item.category,
    subcategory: item.subcategory,
    title: item.title,
    content: item.content,
    summary: item.summary,
    sourceId: item.sourceId,
    sourceName: item.sourceName,
    updatedAt: item.updatedAt.toISOString(),
  }));

  const syncStatus = syncStatusRaw
    ? {
        id: syncStatusRaw.id,
        status: syncStatusRaw.status,
        syncType: syncStatusRaw.syncType,
        itemsAdded: syncStatusRaw.itemsAdded,
        itemsUpdated: syncStatusRaw.itemsUpdated,
        itemsRemoved: syncStatusRaw.itemsRemoved,
        errorCount: syncStatusRaw.errorCount,
        syncedAt: syncStatusRaw.syncedAt.toISOString(),
      }
    : null;

  return { kbItems, syncStatus };
}

export default async function KnowledgeBasePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { kbItems, syncStatus } = await getKnowledgeBaseData(session.user.id);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <KnowledgeBaseView
          items={kbItems}
          syncStatus={syncStatus}
          userId={session.user.id}
        />
      </Suspense>
    </div>
  );
}
