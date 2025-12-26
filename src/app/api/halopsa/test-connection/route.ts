import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { HaloPSAClient } from '@/lib/halopsa/client';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { baseUrl, clientId, clientSecret, tenant } = body;

    if (!baseUrl || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test connection by attempting to authenticate
    const client = new HaloPSAClient({
      baseUrl,
      clientId,
      clientSecret,
      tenant,
    });

    await client.authenticate();

    return NextResponse.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { error: 'Connection failed. Please check your credentials.' },
      { status: 400 }
    );
  }
}
