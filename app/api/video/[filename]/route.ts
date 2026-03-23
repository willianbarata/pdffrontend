
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ filename: string }> } // params is now a Promise in Next.js 15
) {
    const { filename } = await context.params;

    if (!filename) {
        return new NextResponse('Filename is required', { status: 400 });
    }

    // Security: Prevent path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'videos', safeFilename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('Video not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': fileBuffer.length.toString(),
            'Content-Disposition': `inline; filename="${safeFilename}"`, // inline allows playing in browser
            'Cache-Control': 'no-store, must-revalidate', // Ensure we don't cache old references
        },
    });
}
