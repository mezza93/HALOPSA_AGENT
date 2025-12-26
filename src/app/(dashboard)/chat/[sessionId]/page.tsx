import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ChatInterfaceWithHistory } from '@/components/chat/chat-interface-with-history';
import { ChatSkeleton } from '@/components/chat/chat-skeleton';

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: ChatSessionPageProps) {
  const { sessionId } = await params;
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { title: true },
  });

  return {
    title: session?.title || 'Chat Session',
    description: 'Continue your conversation',
  };
}

export default async function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = await params;
  const authSession = await auth();

  if (!authSession) {
    redirect('/login');
  }

  // Fetch the chat session with messages
  const chatSession = await prisma.chatSession.findUnique({
    where: {
      id: sessionId,
      userId: authSession.user.id, // Ensure user owns this session
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      connection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!chatSession) {
    notFound();
  }

  // Convert messages to the format expected by useChat
  const initialMessages = chatSession.messages.map((msg) => ({
    id: msg.id,
    role: msg.role.toLowerCase() as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.createdAt,
  }));

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatInterfaceWithHistory
          userId={authSession.user.id}
          sessionId={chatSession.id}
          initialMessages={initialMessages}
          connectionId={chatSession.connection?.id}
          connectionName={chatSession.connection?.name}
        />
      </Suspense>
    </div>
  );
}
