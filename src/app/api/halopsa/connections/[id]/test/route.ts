import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/utils/encryption';
import { HaloPSAClient } from '@/lib/halopsa/client';

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

    // Get connection
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

    // Decrypt credentials
    const clientId = decrypt(connection.clientId);
    const clientSecret = decrypt(connection.clientSecret);

    // Test connection
    const client = new HaloPSAClient({
      baseUrl: connection.baseUrl,
      clientId,
      clientSecret,
      tenant: connection.tenant || undefined,
    });

    await client.authenticate();

    // Update connection status
    await prisma.haloConnection.update({
      where: { id },
      data: {
        testStatus: 'SUCCESS',
        lastTestedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Connection test error:', error);

    // Update connection status to failed
    const { id } = await params;
    await prisma.haloConnection.update({
      where: { id },
      data: {
        testStatus: 'FAILED',
        lastTestedAt: new Date(),
        testMessage: error instanceof Error ? error.message : 'Connection failed',
      },
    }).catch(() => {});

    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 400 }
    );
  }
}
