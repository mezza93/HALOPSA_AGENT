import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// SECURITY: Whitelist of allowed MIME types and their safe extensions
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

// SECURITY: Validate extension is safe and matches MIME type
function getSecureExtension(mimeType: string, originalFileName: string): string | null {
  // Get allowed extension for this MIME type
  const allowedExt = ALLOWED_TYPES[mimeType];
  if (!allowedExt) {
    return null;
  }

  // Get the original extension (last part after final dot)
  const originalExt = originalFileName.split('.').pop()?.toLowerCase();

  // For JPEG, allow both .jpg and .jpeg
  if (mimeType === 'image/jpeg' && (originalExt === 'jpg' || originalExt === 'jpeg')) {
    return allowedExt;
  }

  // Verify extension matches MIME type
  if (originalExt !== allowedExt) {
    // Extension doesn't match - use the MIME type's safe extension
    return allowedExt;
  }

  return allowedExt;
}

// SECURITY: Validate filename doesn't contain path traversal
function sanitizeFileName(name: string): string {
  // Remove any path separators and null bytes
  return name.replace(/[\\/\0]/g, '_').replace(/\.\./g, '_');
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type against whitelist
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed types: PNG, JPEG, GIF, WebP, PDF, TXT.' },
        { status: 400 }
      );
    }

    // SECURITY: Get a safe extension based on MIME type
    const safeFileName = sanitizeFileName(file.name);
    const safeExtension = getSecureExtension(file.type, safeFileName);

    if (!safeExtension) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Generate unique filename with safe extension
    const fileName = `${randomUUID()}.${safeExtension}`;

    // SECURITY: Validate user ID to prevent path traversal
    const userId = session.user.id.replace(/[^a-zA-Z0-9-_]/g, '');

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', userId);
    await mkdir(uploadsDir, { recursive: true });

    // Save file
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return file info
    const fileUrl = `/uploads/${userId}/${fileName}`;

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      url: fileUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
