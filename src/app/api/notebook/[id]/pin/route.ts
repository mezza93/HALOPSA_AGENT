import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { isPinned } = await req.json();

    // Verify ownership
    const entry = await prisma.notebookEntry.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update pin status
    const updated = await prisma.notebookEntry.update({
      where: { id },
      data: { isPinned },
    });

    return NextResponse.json({ success: true, isPinned: updated.isPinned });
  } catch (error) {
    console.error('[Notebook API] Pin toggle error:', error);
    return NextResponse.json({ error: 'Failed to update pin status' }, { status: 500 });
  }
}
