import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ChatHistory } from '@/components/chat/chat-history';

export const metadata = {
  title: 'Chat History',
  description: 'View your conversation history',
};

export default async function ChatHistoryPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { lastMessageAt: 'desc' },
    include: {
      connection: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
    take: 50,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chat History</h1>
        <p className="text-muted-foreground">
          View and continue your previous conversations
        </p>
      </div>

      <ChatHistory sessions={sessions} />
    </div>
  );
}
