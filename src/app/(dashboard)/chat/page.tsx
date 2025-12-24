import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ChatSkeleton } from '@/components/chat/chat-skeleton';

export const metadata = {
  title: 'Chat',
  description: 'Chat with your AI assistant for HaloPSA',
};

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatInterface userId={session.user.id} />
      </Suspense>
    </div>
  );
}
