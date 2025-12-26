import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HelpSupportView } from '@/components/help/help-support-view';

export const metadata = {
  title: 'Help & Support | HaloPSA AI',
  description: 'Get help with HaloPSA AI through our AI support agent or browse our documentation.',
};

export default async function HelpPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return <HelpSupportView userId={session.user.id} userName={session.user.name} />;
}
