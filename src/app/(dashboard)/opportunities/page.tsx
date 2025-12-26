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

  // Get user's connections
  const connections = await prisma.haloConnection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  // Get knowledge base items count
  const kbItemsCount = await prisma.knowledgeBaseItem.count({
    where: { userId: session.user.id },
  });

  // Get latest sync status
  const latestSync = await prisma.knowledgeBaseSync.findFirst({
    where: { userId: session.user.id },
    orderBy: { syncedAt: 'desc' },
  });

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
