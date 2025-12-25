import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets', 'playground');
    
    // Check if directory exists
    if (!fs.existsSync(assetsDir)) {
      return NextResponse.json({ stickers: [], splats: [], cracks: [] });
    }

    const files = fs.readdirSync(assetsDir);
    const validExtensions = ['.png', '.jpg', '.jpeg', '.svg'];

    // Helper to filter files
    const getFilesByPrefix = (prefix: string) => 
      files
        .filter(file => file.startsWith(prefix) && validExtensions.some(ext => file.endsWith(ext)))
        .map(file => `/assets/playground/${file}`);

    return NextResponse.json({
      stickers: getFilesByPrefix('sticker-'),
      splats: getFilesByPrefix('splat-'),
      cracks: getFilesByPrefix('crack-')
    });

  } catch (error) {
    console.error('Failed to read assets directory:', error);
    return NextResponse.json({ stickers: [], splats: [], cracks: [] });
  }
}