import { readdir, stat } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { AudioFile, GetAudioResponse } from '../../types/reel';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reelId = searchParams.get('reelId');

    const audioDir = path.join(process.cwd(), 'public', 'audio');
    
    // Check if audio directory exists
    try {
      await stat(audioDir);
    } catch (error) {
      // Directory doesn't exist, return empty array
      return NextResponse.json({
        success: true,
        files: []
      });
    }

    // Read all files in the audio directory
    const files = await readdir(audioDir);
    
    // Filter and map audio files
    const audioFiles: AudioFile[] = [];
    
    for (const filename of files) {
      // Only process audio files
      if (!filename.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        continue;
      }

      // If reelId is specified, filter by it
      if (reelId) {
        const pattern = new RegExp(`^reel-${reelId.replace(/[^a-z0-9]/gi, '_')}-`);
        if (!pattern.test(filename)) {
          continue;
        }
      }

      // Get file stats
      const filepath = path.join(audioDir, filename);
      const fileStats = await stat(filepath);

      // Extract reel ID and timestamp from filename
      // Format: reel-{reelId}-{timestamp}.{extension}
      const match = filename.match(/^reel-([^-]+)-(\d+)\./);
      
      if (match) {
        audioFiles.push({
          filename: filename,
          url: `/audio/${filename}`,
          reelId: match[1],
          timestamp: parseInt(match[2]),
          size: fileStats.size
        });
      }
    }

    // Sort by timestamp (newest first)
    audioFiles.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      files: audioFiles
    } as GetAudioResponse);

  } catch (error) {
    console.error('Error reading audio files:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to read audio files',
      } as GetAudioResponse,
      { status: 500 }
    );
  }
}