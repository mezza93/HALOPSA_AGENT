import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
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

  return <SettingsView user={session.user} />;
}
