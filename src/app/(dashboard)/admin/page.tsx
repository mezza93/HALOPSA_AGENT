import { redirect } from 'next/navigation';
import { auth, isAdmin } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Manage users and monitor system usage',
};

export default async function AdminPage() {
  const session = await auth();

  if (!session || !isAdmin(session.user.role)) {
    redirect('/chat');
  }

  return <AdminDashboard />;
}
