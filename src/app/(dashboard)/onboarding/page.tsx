import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata = {
  title: 'Get Started',
  description: 'Set up your HaloPSA AI account',
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Check if user already has connections
  const connectionCount = await prisma.haloConnection.count({
    where: { userId: session.user.id },
  });

  // If user already has connections, redirect to chat
  if (connectionCount > 0) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <OnboardingWizard userId={session.user.id} userName={session.user.name} />
    </div>
  );
}
