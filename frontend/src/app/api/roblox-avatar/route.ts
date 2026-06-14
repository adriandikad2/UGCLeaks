import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Strict validation: Only allow up to 15 digits to prevent malicious payload injection
    if (!userId || !/^\d{1,15}$/.test(userId)) {
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 } // Next.js fetch cache
        });
        
        if (!response.ok) {
            throw new Error(`Roblox API responded with status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data && data.data && data.data.length > 0) {
            const apiResponse = NextResponse.json({ imageUrl: data.data[0].imageUrl });
            // FORCE Edge CDN Caching for 24 hours. This prevents Vercel Server Invocations for duplicate requests!
            apiResponse.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
            return apiResponse;
        }
        
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (error: any) {
        console.error("Roblox Avatar Fetch Error:", error);
        return NextResponse.json({ error: 'Failed to fetch', details: error?.message || 'Unknown error' }, { status: 500 });
    }
}
