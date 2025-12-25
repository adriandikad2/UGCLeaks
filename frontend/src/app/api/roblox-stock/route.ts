import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for stock data (5 minute TTL for successful, 2 min for errors)
const stockCache: Map<string, { data: StockData; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for successful data
const ERROR_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for errors
const RATE_LIMIT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes when rate limited

// Rate limiting tracking
let lastRequestTime = 0;
const MIN_REQUEST_DELAY_MS = 100; // 100ms between requests to Roblox
let isRateLimited = false;
let rateLimitResetTime = 0;

interface StockData {
    currentStock: number;
    totalStock: number;
    error?: string;
}

interface RobloxCatalogResponse {
    id?: number;
    itemType?: string;
    collectibleItemId?: string;
    unitsAvailableForConsumption?: number;
    totalQuantity?: number;
    hasResellers?: boolean;
    saleLocationType?: string;
}

/**
 * Extract asset ID from a Roblox catalog URL
 */
function extractAssetId(url: string): string | null {
    if (!url) return null;
    const catalogMatch = url.match(/\/catalog\/(\d+)/);
    if (catalogMatch) return catalogMatch[1];
    if (/^\d+$/.test(url)) return url;
    return null;
}

/**
 * Wait for rate limit to clear and enforce request spacing
 */
async function waitForRateLimit(): Promise<void> {
    // If we're rate limited, check if we should still wait
    if (isRateLimited && Date.now() < rateLimitResetTime) {
        // Still rate limited, skip this request entirely
        return;
    }
    isRateLimited = false;

    // Enforce minimum delay between requests
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_DELAY_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_DELAY_MS - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();
}

/**
 * Fetch stock data from Roblox catalog API with rate limiting
 */
async function fetchRobloxStock(assetId: string): Promise<StockData> {
    try {
        // Check cache first
        const cached = stockCache.get(assetId);
        if (cached) {
            const age = Date.now() - cached.timestamp;
            // Use appropriate TTL based on whether it was an error or success
            const ttl = cached.data.error ? ERROR_CACHE_TTL_MS : CACHE_TTL_MS;
            if (age < ttl) {
                return cached.data;
            }
        }

        // Check if we're still rate limited
        if (isRateLimited && Date.now() < rateLimitResetTime) {
            // Return cached data if available, or error
            if (cached) return cached.data;
            return {
                currentStock: -1,
                totalStock: -1,
                error: 'Rate limited - retrying later'
            };
        }

        // Wait for rate limit and request spacing
        await waitForRateLimit();

        // Fetch from Roblox catalog API
        const response = await fetch(
            `https://catalog.roblox.com/v1/catalog/items/${assetId}/details?itemType=Asset`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                signal: AbortSignal.timeout(10000),
            }
        );

        // Handle rate limiting (429)
        if (response.status === 429) {
            console.warn(`Rate limited by Roblox API`);
            isRateLimited = true;
            rateLimitResetTime = Date.now() + RATE_LIMIT_CACHE_TTL_MS;

            // Return cached data if available
            if (cached) {
                // Extend the cache timestamp to prevent re-fetching
                stockCache.set(assetId, { data: cached.data, timestamp: Date.now() });
                return cached.data;
            }

            const rateLimitData: StockData = {
                currentStock: -1,
                totalStock: -1,
                error: 'Rate limited'
            };
            stockCache.set(assetId, { data: rateLimitData, timestamp: Date.now() });
            return rateLimitData;
        }

        if (!response.ok) {
            const errorData: StockData = {
                currentStock: -1,
                totalStock: -1,
                error: `HTTP ${response.status}`
            };
            stockCache.set(assetId, { data: errorData, timestamp: Date.now() });
            return errorData;
        }

        const data: RobloxCatalogResponse = await response.json();

        // Check if this is a collectible/limited item
        if (data.collectibleItemId && data.totalQuantity !== undefined) {
            const stockData: StockData = {
                currentStock: data.unitsAvailableForConsumption ?? 0,
                totalStock: data.totalQuantity,
            };
            stockCache.set(assetId, { data: stockData, timestamp: Date.now() });
            return stockData;
        }

        // Not a limited/collectible item
        const notLimitedData: StockData = {
            currentStock: -1,
            totalStock: -1,
            error: 'Not a limited item'
        };
        stockCache.set(assetId, { data: notLimitedData, timestamp: Date.now() });
        return notLimitedData;

    } catch (error) {
        console.error(`Error fetching stock for asset ${assetId}:`, error);
        const errorData: StockData = {
            currentStock: -1,
            totalStock: -1,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
        stockCache.set(assetId, { data: errorData, timestamp: Date.now() });
        return errorData;
    }
}

/**
 * GET /api/roblox-stock?ids=123,456,789
 * 
 * Returns: { [assetId]: { currentStock, totalStock, error? } }
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const idsParam = searchParams.get('ids');
        const urlsParam = searchParams.get('urls');

        let assetIds: string[] = [];

        // Parse asset IDs from 'ids' parameter
        if (idsParam) {
            assetIds = idsParam.split(',').filter(id => /^\d+$/.test(id.trim()));
        }

        // Parse asset IDs from 'urls' parameter
        if (urlsParam) {
            const urls = urlsParam.split(',');
            for (const url of urls) {
                const assetId = extractAssetId(url.trim());
                if (assetId) {
                    assetIds.push(assetId);
                }
            }
        }

        // Remove duplicates
        assetIds = Array.from(new Set(assetIds));

        if (assetIds.length === 0) {
            return NextResponse.json(
                { error: 'No valid asset IDs provided. Use ?ids=123,456 or ?urls=...' },
                { status: 400 }
            );
        }

        // Limit to prevent abuse
        if (assetIds.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 asset IDs per request' },
                { status: 400 }
            );
        }

        // Fetch stock data SEQUENTIALLY to avoid rate limiting
        // Process in small batches with delays
        const stockData: Record<string, StockData> = {};
        const BATCH_SIZE = 5; // Process 5 at a time

        for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
            const batch = assetIds.slice(i, i + BATCH_SIZE);

            // Process each batch in parallel (small batch = okay)
            const results = await Promise.all(
                batch.map(async (id) => ({
                    id,
                    data: await fetchRobloxStock(id),
                }))
            );

            for (const result of results) {
                stockData[result.id] = result.data;
            }

            // Small delay between batches if there are more
            if (i + BATCH_SIZE < assetIds.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return NextResponse.json(stockData, {
            headers: {
                'Cache-Control': 'public, max-age=60', // Browser cache for 60 seconds
            },
        });

    } catch (error) {
        console.error('Error in roblox-stock API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
