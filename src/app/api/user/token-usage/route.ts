import { auth } from '@/lib/auth';
import { checkUserTokenLimit } from '@/lib/api-keys';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenStatus = await checkUserTokenLimit(session.user.id);

    return NextResponse.json({
      tokensUsed: tokenStatus.tokensUsed,
      tokensRemaining: tokenStatus.tokensRemaining,
      monthlyLimit: tokenStatus.monthlyLimit,
      percentUsed: tokenStatus.percentUsed,
      hasLimit: tokenStatus.hasLimit,
      isUnlimited: tokenStatus.isUnlimited || false,
    });
  } catch (error) {
    console.error('[Token Usage API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get token usage' },
      { status: 500 }
    );
  }
}
