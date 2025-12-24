import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ConnectionsManager } from '@/components/settings/connections-manager';

export const metadata = {
  title: 'Connections',
  description: 'Manage your HaloPSA connections',
};

export default async function ConnectionsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const connections = await prisma.haloConnection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      baseUrl: true,
      isActive: true,
      isDefault: true,
      testStatus: true,
      lastTestedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">HaloPSA Connections</h1>
        <p className="text-muted-foreground">
          Manage your HaloPSA instance connections
        </p>
      </div>

      <ConnectionsManager connections={connections} />
    </div>
  );
}
