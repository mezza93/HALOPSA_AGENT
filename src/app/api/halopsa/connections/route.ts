import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/utils/encryption';
import { z } from 'zod';

const createConnectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  baseUrl: z.string().url('Invalid URL'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  tenant: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createConnectionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, baseUrl, clientId, clientSecret, tenant } = result.data;

    // Check if this is the user's first connection
    const existingConnections = await prisma.haloConnection.count({
      where: { userId: session.user.id },
    });

    // Encrypt sensitive credentials
    const encryptedClientId = encrypt(clientId);
    const encryptedClientSecret = encrypt(clientSecret);

    // Create connection
    const connection = await prisma.haloConnection.create({
      data: {
        userId: session.user.id,
        name,
        baseUrl: baseUrl.replace(/\/$/, ''), // Remove trailing slash
        clientId: encryptedClientId,
        clientSecret: encryptedClientSecret,
        tenant,
        isDefault: existingConnections === 0, // First connection is default
        testStatus: 'SUCCESS', // Already tested before saving
      },
      select: {
        id: true,
        name: true,
        baseUrl: true,
        isDefault: true,
        testStatus: true,
        createdAt: true,
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error('Create connection error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await prisma.haloConnection.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        baseUrl: true,
        isActive: true,
        isDefault: true,
        testStatus: true,
        lastTestedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    return NextResponse.json(
      { error: 'Failed to get connections' },
      { status: 500 }
    );
  }
}
