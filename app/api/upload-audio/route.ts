import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File | null;
    const reelId = formData.get('reelId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!reelId) {
      return NextResponse.json(
        { success: false, error: 'No reel ID provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('audio')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload an audio file.' },
        { status: 400 }
      );
    }

    // Validate file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create audio directory if it doesn't exist
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    try {
      await mkdir(audioDir, { recursive: true });
    } catch (error) {
      // Directory already exists, ignore error
    }

    // Generate filename with sanitized reel ID
    const timestamp = Date.now();
    const sanitizedReelId = reelId.replace(/[^a-z0-9]/gi, '_');
    const extension = file.name.split('.').pop() || 'mp3';
    const filename = `reel-${sanitizedReelId}-${timestamp}.${extension}`;
    const filepath = path.join(audioDir, filename);

    // Write file
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/audio/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}