import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Debug: Log session state in development
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('authjs.session-token') || cookieStore.get('__Secure-authjs.session-token');
    console.log('[DashboardLayout] Session:', session ? 'exists' : 'null');
    console.log('[DashboardLayout] Session token cookie:', sessionToken ? 'exists' : 'missing');
  }

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
