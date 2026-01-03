import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { OpportunitiesView } from '@/components/opportunities/opportunities-view';
import type { HaloConnection } from '@prisma/client';

export const metadata = {
  title: 'Opportunities | HaloPSA AI',
  description: 'Discover unconfigured features and optimization opportunities for your HaloPSA setup.',
};

export default async function OpportunitiesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Run all queries in parallel for better performance
  const [connections, kbItemsCount, latestSync] = await Promise.all([
    // Get user's connections
    prisma.haloConnection.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    }),
    // Get knowledge base items count
    prisma.knowledgeBaseItem.count({
      where: { userId: session.user.id },
    }),
    // Get latest sync status
    prisma.knowledgeBaseSync.findFirst({
      where: { userId: session.user.id },
      orderBy: { syncedAt: 'desc' },
    }),
  ]);

  return (
    <OpportunitiesView
      userId={session.user.id}
      connections={connections.map((c: HaloConnection) => ({
        id: c.id,
        name: c.name,
        baseUrl: c.baseUrl,
        isDefault: c.isDefault,
        lastUsedAt: c.lastUsedAt?.toISOString() || null,
      }))}
      kbItemsCount={kbItemsCount}
      lastSyncAt={latestSync?.syncedAt?.toISOString() || null}
    />
  );
}
