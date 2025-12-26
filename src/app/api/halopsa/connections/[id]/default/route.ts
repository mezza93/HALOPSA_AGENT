import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const connection = await prisma.haloConnection.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Remove default from all other connections
    await prisma.haloConnection.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this connection as default
    await prisma.haloConnection.update({
      where: { id },
      data: { isDefault: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set default connection error:', error);
    return NextResponse.json(
      { error: 'Failed to set default connection' },
      { status: 500 }
    );
  }
}
