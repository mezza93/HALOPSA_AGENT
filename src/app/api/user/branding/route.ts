import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const brandingSchema = z.object({
  primaryColor: z.string().regex(hexColorRegex, 'Invalid hex color format').nullable().optional(),
  secondaryColor: z.string().regex(hexColorRegex, 'Invalid hex color format').nullable().optional(),
  reportNaming: z.string().max(200, 'Naming schema must be less than 200 characters').nullable().optional(),
  logoUrl: z.string().url('Invalid URL format').nullable().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        brandPrimaryColor: true,
        brandSecondaryColor: true,
        brandReportNaming: true,
        brandLogoUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      primaryColor: user.brandPrimaryColor || '#14b8a6',
      secondaryColor: user.brandSecondaryColor || '#0d9488',
      reportNaming: user.brandReportNaming || '{company} - {type} - {date}',
      logoUrl: user.brandLogoUrl || null,
    });
  } catch (error) {
    console.error('Failed to get branding settings:', error);
    return NextResponse.json(
      { error: 'Failed to get branding settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = brandingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { primaryColor, secondaryColor, reportNaming, logoUrl } = result.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        brandPrimaryColor: primaryColor,
        brandSecondaryColor: secondaryColor,
        brandReportNaming: reportNaming,
        brandLogoUrl: logoUrl,
      },
      select: {
        brandPrimaryColor: true,
        brandSecondaryColor: true,
        brandReportNaming: true,
        brandLogoUrl: true,
      },
    });

    return NextResponse.json({
      primaryColor: updatedUser.brandPrimaryColor,
      secondaryColor: updatedUser.brandSecondaryColor,
      reportNaming: updatedUser.brandReportNaming,
      logoUrl: updatedUser.brandLogoUrl,
    });
  } catch (error) {
    console.error('Failed to update branding settings:', error);
    return NextResponse.json(
      { error: 'Failed to update branding settings' },
      { status: 500 }
    );
  }
}
