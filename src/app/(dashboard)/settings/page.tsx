import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SettingsProfile } from '@/components/settings/settings-profile';

export const metadata = {
  title: 'Settings',
  description: 'Manage your account settings',
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <SettingsProfile user={session.user} />
    </div>
  );
}
