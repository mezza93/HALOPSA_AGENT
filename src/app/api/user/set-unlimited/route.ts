import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * POST /api/user/set-unlimited
 * Sets the current user's plan to UNLIMITED for testing purposes.
 * In production, this should be restricted to admins only.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user's plan to UNLIMITED
    await prisma.user.update({
      where: { id: session.user.id },
      data: { plan: 'UNLIMITED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Your account now has unlimited tokens',
      plan: 'UNLIMITED',
    });
  } catch (error) {
    console.error('[Set Unlimited API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/set-unlimited
 * Reverts the current user's plan back to FREE.
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Revert user's plan to FREE
    await prisma.user.update({
      where: { id: session.user.id },
      data: { plan: 'FREE' },
    });

    return NextResponse.json({
      success: true,
      message: 'Your account is now on the FREE plan',
      plan: 'FREE',
    });
  } catch (error) {
    console.error('[Set Unlimited API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}
