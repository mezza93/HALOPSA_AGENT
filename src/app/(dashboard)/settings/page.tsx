import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsView } from '@/components/settings/settings-view';

export const metadata = {
  title: 'Settings',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch user's connections
  const connections = await prisma.haloConnection.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'asc' },
    ],
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

  return <SettingsView user={session.user} connections={connections} />;
}
