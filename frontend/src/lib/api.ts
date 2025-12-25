/**
 * API Client Utilities
 * Frontend utilities for calling backend API endpoints
 */

// Use relative paths - Next.js handles routing to src/app/api
const API_BASE_URL = '/api';

// ==================== UGC ITEMS ====================

export interface UGCItem {
  id?: number;
  uuid?: string;
  title: string;
  item_name: string;
  creator: string;
  creator_link?: string;
  stock: number | string;
  release_date_time: string;
  method: string;
  instruction?: string;
  game_link?: string;
  item_link?: string;
  image_url?: string;
  limit_per_user: number;
  color?: string;
  created_at?: string;
  updated_at?: string;
  is_published?: boolean;
  sold_out?: boolean; // Manual sold out confirmation by scheduler
  final_current_stock?: number; // Persisted current stock when item sold out
  final_total_stock?: number; // Persisted total stock when item sold out
}

/**
 * Fetch all UGC items with optional filtering
 */
export async function getItems(params?: {
  creator?: string;
  method?: string;
  limit?: number;
  offset?: number;
}): Promise<UGCItem[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.creator) queryParams.append('creator', params.creator);
      if (params.method) queryParams.append('method', params.method);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
    }

    const response = await fetch(`${API_BASE_URL}/items?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  } catch (error) {
    console.error('Error fetching items:', error);
    return [];
  }
}

/**
 * Fetch a single UGC item by ID
 */
export async function getItem(id: string): Promise<UGCItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch item');
    return await response.json();
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

/**
 * Create a new UGC item
 */
export async function createItem(item: UGCItem): Promise<UGCItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to create item');
    return await response.json();
  } catch (error) {
    console.error('Error creating item:', error);
    return null;
  }
}

/**
 * Update an existing UGC item
 */
export async function updateItem(id: string, updates: Partial<UGCItem>): Promise<UGCItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update item');
    return await response.json();
  } catch (error) {
    console.error('Error updating item:', error);
    return null;
  }
}

/**
 * Delete a UGC item
 */
export async function deleteItem(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
    return true;
  } catch (error) {
    console.error('Error deleting item:', error);
    return false;
  }
}

// ==================== SCHEDULED ITEMS ====================

/**
 * Fetch all scheduled items
 */
export async function getScheduledItems(params?: {
  limit?: number;
  offset?: number;
}): Promise<UGCItem[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.offset) queryParams.append('offset', params.offset.toString());
    }

    const response = await fetch(`${API_BASE_URL}/scheduled?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch scheduled items');
    return await response.json();
  } catch (error) {
    console.error('Error fetching scheduled items:', error);
    return [];
  }
}

/**
 * Create a new scheduled item
 */
export async function createScheduledItem(item: UGCItem): Promise<UGCItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/scheduled`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create scheduled item');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating scheduled item:', error);
    return null;
  }
}

/**
 * Update a scheduled item
 */
export async function updateScheduledItem(id: string, updates: Partial<UGCItem>): Promise<UGCItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/scheduled/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update scheduled item');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating scheduled item:', error);
    return null;
  }
}

/**
 * Delete a scheduled item
 */
export async function deleteScheduledItem(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/scheduled/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete scheduled item');
    return true;
  } catch (error) {
    console.error('Error deleting scheduled item:', error);
    return false;
  }
}

// ==================== HEALTH CHECK ====================

/**
 * Check API and database health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
}

// ==================== ROBLOX STOCK ====================

export interface RobloxStockData {
  currentStock: number;
  totalStock: number;
  error?: string;
}

/**
 * Extract Roblox asset ID from a catalog URL
 */
export function extractRobloxAssetId(url: string): string | null {
  if (!url) return null;

  // Match /catalog/{id} pattern
  const catalogMatch = url.match(/\/catalog\/(\d+)/);
  if (catalogMatch) return catalogMatch[1];

  // Match direct asset ID if passed
  if (/^\d+$/.test(url)) return url;

  return null;
}

/**
 * Fetch real-time stock data for multiple Roblox items
 * @param assetIds Array of Roblox asset IDs
 * @returns Map of assetId -> stock data
 */
export async function getRobloxStock(assetIds: string[]): Promise<Record<string, RobloxStockData>> {
  if (!assetIds.length) return {};

  try {
    const response = await fetch(`${API_BASE_URL}/roblox-stock?ids=${assetIds.join(',')}`);
    if (!response.ok) {
      console.error('Failed to fetch Roblox stock:', response.status);
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Roblox stock:', error);
    return {};
  }
}

