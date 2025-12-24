import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - hidden on mobile */}
      <DashboardSidebar user={session.user} />

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <DashboardHeader user={session.user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
