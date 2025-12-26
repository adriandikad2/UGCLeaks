'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClickableInstructions, NoLinkTemplate } from '../InstructionParser';
import { useTheme } from '../components/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { hasAccess, isAuthenticated, signout, getUserRole } from '@/lib/auth';
import { ToastContainer, useToast } from '@/app/Toast';
import { getRobloxStock, extractRobloxAssetId, RobloxStockData, updateScheduledItem } from '@/lib/api';

enum UGCMethod {
  WebDrop = 'Web Drop',
  InGame = 'In-Game',
  CodeDrop = 'Code Drop',
  Unknown = 'Unknown'
}

type UGCItem = {
  id: string;
  title: string;
  itemName: string;
  creator: string;

  stock: number | 'OUT OF STOCK' | 'unknown' | 'Unknown';
  releaseDateTime: string;
  method: UGCMethod;
  instruction: string;
  gameLink: string;
  itemLink: string;
  imageUrl: string;
  limitPerUser: number;

  soldOut?: boolean; // Manual sold out confirmation by scheduler
  finalCurrentStock?: number; // Persisted current stock when item sold out
  finalTotalStock?: number; // Persisted total stock when item sold out
  ugcCode?: string; // Code for Code Drop items
  isAbandoned?: boolean; // Abandoned status
};

const OUTLINE_COLORS = ['#ff006e', '#00d9ff', '#ffbe0b', '#00ff41', '#b54eff'];

const generateRandomColor = () => {
  return OUTLINE_COLORS[Math.floor(Math.random() * OUTLINE_COLORS.length)];
};

// Seeded random function for deterministic gradient generation
const seededRandom = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 1000 / 1000; // Return 0-1
};

// Shuffle theme gradient CSS variables deterministically per item ID
const shuffleThemeGradients = (id: string): string[] => {
  const themeColors = [
    'var(--theme-gradient-1)',
    'var(--theme-gradient-2)',
    'var(--theme-gradient-3)',
    'var(--theme-gradient-4)',
  ];

  // Use seeded sort for deterministic shuffling based on item ID
  const shuffled = [...themeColors].sort((a, b) => {
    const seedA = seededRandom(id + a);
    const seedB = seededRandom(id + b);
    return seedA - seedB;
  });
  return shuffled;
};

export default function LeaksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<UGCMethod | 'All'>('All');
  const [releaseStatusFilter, setReleaseStatusFilter] = useState<'all' | 'released' | 'upcoming'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'stock' | 'limit' | 'upcoming'>('upcoming');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [items, setItems] = useState<UGCItem[]>([]);
  const [scheduledItems, setScheduledItems] = useState<UGCItem[]>([]);
  const [gradients, setGradients] = useState<{ [key: string]: string[] }>({});
  const [viewMode, setViewMode] = useState<'active' | 'abandoned'>('active');
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveStock, setLiveStock] = useState<{ [assetId: string]: RobloxStockData }>({});
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);
  const [isHudMinimized, setIsHudMinimized] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  // Hooks
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { currentTheme } = useTheme();
  const isGrayscale = currentTheme.name === 'bw';

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setIsEditor(hasAccess('editor'));
  }, []);

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignout = async () => {
    await signout();
    setAuthenticated(false);
    addToast('Signed out successfully', 'success');
    router.push('/');
  };

  // Viewport/Modal States
  const [selectedItem, setSelectedItem] = useState<UGCItem | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: string }>({});

  // Extract load function so it can be called for refresh
  const loadScheduledItems = async () => {
    try {
      const { getScheduledItems } = await import('@/lib/api');
      const scheduled = await getScheduledItems();
      if (scheduled && scheduled.length > 0) {
        const converted = scheduled.map((item: any) => ({
          id: item.uuid || item.id,
          title: item.title,
          itemName: item.item_name,
          creator: item.creator,

          stock: item.stock,
          releaseDateTime: item.release_date_time_utc || item.release_date_time,
          method: item.method,
          instruction: item.instruction,
          gameLink: item.game_link,
          itemLink: item.item_link,
          imageUrl: item.image_url,
          limitPerUser: item.limit_per_user,
          soldOut: item.sold_out, // Manual sold out confirmation
          finalCurrentStock: item.final_current_stock, // Persisted current stock
          finalTotalStock: item.final_total_stock, // Persisted total stock
          ugcCode: item.ugc_code, // Code if applicable
          isAbandoned: item.is_abandoned, // Abandoned status
        }));
        setScheduledItems(converted);

        // Generate shuffled gradients for scheduled items
        const apiGradients: { [key: string]: string[] } = {};
        converted.forEach((item: any) => {
          apiGradients[item.id] = shuffleThemeGradients(item.id);
        });
        setGradients(prev => ({ ...prev, ...apiGradients }));
      }
    } catch (error) {
      console.error('Failed to load scheduled items from API:', error);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadScheduledItems();
    setIsRefreshing(false);
    addToast('Items refreshed!', 'success');
  };

  useEffect(() => {
    setIsMounted(true);
    loadScheduledItems();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const allItems = [...items, ...scheduledItems];
      const newTimers: { [key: string]: string } = {};

      allItems.forEach(item => {
        if (!item.releaseDateTime) return;

        // Ensure date is parsed as UTC - convert to ISO format (replace space with T) and append Z
        let dateStr = item.releaseDateTime;
        if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
          // Database returns "2025-12-26 03:00:00" but ISO needs "2025-12-26T03:00:00Z"
          dateStr = dateStr.replace(' ', 'T') + 'Z';
        }

        // Check for Sentinel Date (Unknown)
        if (dateStr.startsWith('9999')) {
          newTimers[item.id] = 'Unknown';
          return;
        }
        const releaseTime = new Date(dateStr).getTime();
        const nowTime = new Date().getTime();
        const diff = releaseTime - nowTime;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          if (days > 0) newTimers[item.id] = `in ${days}d ${hours}h`;
          else if (hours > 0) newTimers[item.id] = `in ${hours}h ${mins}m`;
          else newTimers[item.id] = `in ${mins}m ${secs}s`;
        } else {
          const elapsed = Math.abs(diff);
          const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
          const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((elapsed % (1000 * 60)) / 1000);
          if (days > 0) newTimers[item.id] = `${days}d ${hours}h ago`;
          else if (hours > 0) newTimers[item.id] = `${hours}h ${mins}m ago`;
          else if (mins > 0) newTimers[item.id] = `${mins}m ${secs}s ago`;
          else newTimers[item.id] = `${secs}s ago`;
        }
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [items, scheduledItems]);

  // Stock polling effect - fetch live stock every 60 seconds
  const fetchLiveStock = useCallback(async () => {
    const allItems = [...items, ...scheduledItems];
    const assetIds: string[] = [];
    const assetIdToItemId: { [assetId: string]: string } = {};

    // Extract asset IDs from item links (skip sold-out items to reduce API calls)
    allItems.forEach(item => {
      // Skip items marked as sold out by schedulers
      if (item.soldOut) return;

      if (item.itemLink) {
        const assetId = extractRobloxAssetId(item.itemLink);
        if (assetId) {
          assetIds.push(assetId);
          assetIdToItemId[assetId] = item.id;
        }
      }
    });

    if (assetIds.length === 0) return;

    try {
      const stockData = await getRobloxStock(assetIds);
      // Merge new data with existing data (don't replace, to avoid losing data for items not in current response)
      setLiveStock(prev => ({
        ...prev,
        ...stockData
      }));
      setLastStockUpdate(new Date());

      // Auto-persist sold-out items: detect items with currentStock === 0 and save their final stock values
      for (const assetId of Object.keys(stockData)) {
        const data = stockData[assetId];
        // Only process items that are sold out (currentStock === 0) and have valid data
        if (data.currentStock === 0 && data.totalStock > 0 && !data.error) {
          const itemId = assetIdToItemId[assetId];
          if (itemId) {
            // Find the item to check if it's already marked as sold out
            const item = allItems.find(i => i.id === itemId);
            if (item && !item.soldOut) {
              // Auto-mark as sold out and persist final stock values
              console.log(`Auto-marking item ${itemId} as sold out with stock ${data.currentStock}/${data.totalStock}`);
              updateScheduledItem(itemId, {
                sold_out: true,
                final_current_stock: data.currentStock,
                final_total_stock: data.totalStock
              }).catch(err => console.error('Failed to auto-persist sold-out item:', err));

              // Update local state immediately to prevent re-checking
              setScheduledItems(prev => prev.map(i =>
                i.id === itemId
                  ? { ...i, soldOut: true, finalCurrentStock: data.currentStock, finalTotalStock: data.totalStock }
                  : i
              ));
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch live stock:', error);
    }
  }, [items, scheduledItems]);

  useEffect(() => {
    // Initial fetch after a short delay
    const initialDelay = setTimeout(() => {
      fetchLiveStock();
    }, 2000);

    // Poll every 10 minutes (to reduce Roblox API pressure)
    const interval = setInterval(fetchLiveStock, 600000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [fetchLiveStock]);

  const filteredItems = [...items, ...scheduledItems]
    .filter(item => {
      // Filter by View Mode (Active vs Abandoned)
      const isAbandoned = item.isAbandoned || false;
      if (viewMode === 'active' && isAbandoned) return false;
      if (viewMode === 'abandoned' && !isAbandoned) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(searchLower) ||
        item.creator.toLowerCase().includes(searchLower) ||
        item.itemName.toLowerCase().includes(searchLower);
      const matchesMethod = filterMethod === 'All' || item.method === filterMethod;

      // Release status filter
      let matchesReleaseStatus = true;
      if (releaseStatusFilter !== 'all' && item.releaseDateTime) {
        const now = new Date().getTime();
        const releaseTime = new Date(item.releaseDateTime).getTime();
        if (releaseStatusFilter === 'released') {
          matchesReleaseStatus = releaseTime <= now;
        } else if (releaseStatusFilter === 'upcoming') {
          matchesReleaseStatus = releaseTime > now;
        }
      }

      return matchesSearch && matchesMethod && matchesReleaseStatus;
    })
    .sort((a, b) => {
      let result = 0;
      const now = new Date().getTime();

      if (sortBy === 'upcoming') {
        // Sort by closest future release first
        const timeA = new Date(a.releaseDateTime).getTime();
        const timeB = new Date(b.releaseDateTime).getTime();
        const diffA = timeA - now;
        const diffB = timeB - now;

        // Future items come first, then by closest time
        if (diffA > 0 && diffB > 0) {
          result = diffA - diffB; // Both future: closer first
        } else if (diffA > 0) {
          result = -1; // A is future, B is past
        } else if (diffB > 0) {
          result = 1; // B is future, A is past
        } else {
          result = diffB - diffA; // Both past: more recent first
        }
      } else if (sortBy === 'recent') {
        result = new Date(b.releaseDateTime).getTime() - new Date(a.releaseDateTime).getTime();
      } else if (sortBy === 'stock') {
        const stockA = typeof a.stock === 'number' ? a.stock : -1;
        const stockB = typeof b.stock === 'number' ? b.stock : -1;
        result = stockB - stockA;
      } else if (sortBy === 'limit') {
        result = b.limitPerUser - a.limitPerUser;
      }

      return sortDirection === 'desc' ? -result : result;
    });

  // Get next upcoming items for HUD
  const nextUpItems = [...items, ...scheduledItems]
    .filter(item => {
      const releaseTime = new Date(item.releaseDateTime).getTime();
      return releaseTime > new Date().getTime(); // Only future items
    })
    .sort((a, b) => {
      return new Date(a.releaseDateTime).getTime() - new Date(b.releaseDateTime).getTime();
    })
    .slice(0, 3); // Show up to 3 next items

  const openModal = (item: UGCItem) => {
    setSelectedItem(item);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className={`min-h-screen p-6 md:p-10 transition-all duration-700 ${isGrayscale ? 'bg-gray-900' : ''}`}>
      {/* --- NAVIGATION HEADER (Scroll-Aware) --- */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-black/60 backdrop-blur-xl shadow-lg py-3' : 'py-4'}`}>
        <div className="flex justify-between items-center px-4 md:px-6">
          {/* Left: Navigation */}
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300"
            >
              <span className="hidden md:inline">← </span>Home
            </button>
            {authenticated ? (
              <button
                onClick={handleSignout}
                className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-red-600 hover:border-red-600 transition-all duration-300"
              >
                <span className="hidden md:inline">🚪 </span>Sign Out
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-blue-600 hover:border-blue-600 transition-all duration-300"
                >
                  <span className="hidden md:inline">🔓 </span>Sign In
                </button>
                <button
                  onClick={() => router.push('/auth/signup')}
                  className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-green-600 hover:border-green-600 transition-all duration-300"
                >
                  <span className="hidden md:inline">✍️ </span>Sign Up
                </button>
              </>
            )}
          </div>

          {/* Right: Theme Switcher */}
          <ThemeSwitcher inline />
        </div>
      </div>

      {/* --- TOAST NOTIFICATIONS --- */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4 pop-in">
          <h1 className="text-5xl md:text-6xl font-black rainbow-text drop-shadow-2xl">
            🔥 UGC LEAKS 🔥
          </h1>
          <div className="h-2 w-80 mx-auto theme-gradient-bar rounded-full glow-pink blocky-shadow"></div>
          <p className="theme-on-bg-text text-lg md:text-xl drop-shadow-lg font-semibold">
            Track the hottest upcoming Roblox UGC drops
          </p>
        </div>

        <div className="flex justify-center">
          {isEditor && (
            <button
              onClick={() => router.push('/schedule')}
              className="px-8 py-4 text-white font-black rounded-xl blocky-shadow-hover text-lg uppercase tracking-wide hover:scale-105 transition-all"
              style={{ background: 'linear-gradient(to right, var(--theme-gradient-1), var(--theme-gradient-2))' }}
            >
              📅 Create Schedule
            </button>
          )}
        </div>

        {/* --- TABS --- */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setViewMode('active')}
            className={`px-6 py-2 rounded-full font-black text-sm md:text-lg transition-all ${viewMode === 'active'
              ? 'text-white shadow-lg scale-105 ring-2 ring-white'
              : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
              }`}
            style={viewMode === 'active' ? { background: 'linear-gradient(to right, var(--theme-gradient-1), var(--theme-gradient-2))' } : {}}
          >
            🚀 Active Drops
          </button>
          <button
            onClick={() => setViewMode('abandoned')}
            className={`px-6 py-2 rounded-full font-black text-sm md:text-lg transition-all ${viewMode === 'abandoned'
              ? 'bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-lg scale-105 ring-2 ring-white'
              : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
              }`}
          >
            🏚️ Abandoned
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="theme-on-bg-text font-bold uppercase text-sm">🔍 Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Item, creator, name..."
              className="w-full px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none theme-bg-card"
              style={{ borderColor: 'var(--theme-gradient-2)' }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="theme-on-bg-text font-bold uppercase text-sm">🎯 Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as UGCMethod | 'All')}
              className="w-full px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none theme-bg-card"
              style={{ borderColor: 'var(--theme-gradient-3)' }}
            >
              <option value="All">All Methods</option>
              <option value={UGCMethod.WebDrop}>🌐 Web Drop</option>
              <option value={UGCMethod.InGame}>🎮 In-Game</option>
              <option value={UGCMethod.CodeDrop}>🗝️ Code Drop</option>
              <option value={UGCMethod.Unknown}>❓ Unknown</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="theme-on-bg-text font-bold uppercase text-sm">📅 Status</label>
            <select
              value={releaseStatusFilter}
              onChange={(e) => setReleaseStatusFilter(e.target.value as 'all' | 'released' | 'upcoming')}
              className="px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none theme-bg-card"
              style={{ borderColor: 'var(--theme-gradient-3)' }}
            >
              <option value="all">📋 All</option>
              <option value="upcoming">⏳ Upcoming</option>
              <option value="released">✅ Released</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="theme-on-bg-text font-bold uppercase text-sm">📊 Sort</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'stock' | 'limit' | 'upcoming')}
                className="px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-4)' }}
              >
                <option value="upcoming">🚀 Next Up</option>
                <option value="recent">⏱️ Recent</option>
                <option value="stock">📦 Stock</option>
                <option value="limit">🔢 Limit</option>
              </select>
              <button
                onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 rounded-lg border-4 theme-bg-card font-bold text-gray-900 hover:text-white transition-all"
                style={{ borderColor: 'var(--theme-gradient-3)' }}
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-3 rounded-lg border-4 theme-bg-card font-bold text-gray-900 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ borderColor: 'var(--theme-gradient-2)' }}
                title="Refresh items"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredItems.map((item, index) => {
            // Use shuffled theme gradient colors based on item ID for variety
            const shuffledColors = shuffleThemeGradients(item.id);
            const outlineColor = shuffledColors[0];
            const gradientStr = `linear-gradient(135deg, ${shuffledColors[0]}, ${shuffledColors[1]}, ${shuffledColors[2]}, ${shuffledColors[3]})`;

            // Get live stock data for this item
            const assetId = item.itemLink ? extractRobloxAssetId(item.itemLink) : null;
            const liveStockData = assetId ? liveStock[assetId] : null;
            const hasLiveStock = liveStockData && liveStockData.currentStock >= 0 && liveStockData.totalStock >= 0;
            // Item is sold out if: manually marked OR live stock shows 0 OR scheduled stock is 0
            const isSoldOut = item.soldOut ||
              (hasLiveStock && liveStockData.currentStock === 0) ||
              (item.stock === 0) ||
              (item.stock === 'OUT OF STOCK');

            return (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className={`cursor-pointer pop-in theme-bg-card rounded-xl overflow-hidden border-4 shadow-2xl blocky-shadow-hover flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative ${isSoldOut ? 'opacity-60 grayscale' : ''}`}
                style={{ borderColor: isSoldOut ? '#888' : outlineColor }}
              >
                <div
                  className="h-3 w-full"
                  style={{
                    backgroundImage: isSoldOut ? 'linear-gradient(135deg, #666, #888)' : gradientStr,
                    backgroundSize: '400% 400%',
                    animation: 'random-gradient 6s ease infinite',
                  }}
                ></div>

                {/* SOLD OUT Banner */}
                {isSoldOut && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div
                      className="bg-red-600 text-white font-black text-lg uppercase tracking-widest py-2 px-8 rotate-[-15deg] shadow-lg"
                      style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}
                    >
                      SOLD OUT
                    </div>
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-center mb-3">
                    <div
                      className="p-3 rounded-lg border-3 theme-bg-card"
                      style={{
                        borderColor: outlineColor,
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-24 h-24 object-contain rounded"
                        width={96}
                        height={96}
                      />
                    </div>
                  </div>

                  <h2
                    className="text-lg font-black text-center line-clamp-2 mb-1"
                    style={{ color: outlineColor }}
                  >
                    {item.title}
                  </h2>

                  <p className="text-center text-xs font-bold text-gray-600 mb-3">
                    by <span style={{ color: outlineColor }}>{item.creator}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[0] }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📦 Stock</p>
                      <p className="font-black text-xs mt-1" style={{ color: isSoldOut ? '#888' : shuffledColors[0] }}>
                        {hasLiveStock
                          ? `${liveStockData.currentStock}/${liveStockData.totalStock}`
                          : (item.soldOut && item.finalCurrentStock !== undefined && item.finalTotalStock !== undefined
                            ? `${item.finalCurrentStock}/${item.finalTotalStock}`
                            : (item.stock === 'unknown' || item.stock === 'Unknown' || item.stock === -1
                              ? '❓ Unknown'
                              : (typeof item.stock === 'number' ? item.stock : 'OUT')))}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[1] }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🎯 Method</p>
                      <p className="font-black text-xs mt-1 line-clamp-2" style={{ color: shuffledColors[1] }}>
                        {item.method === UGCMethod.WebDrop
                          ? 'Web Drop'
                          : item.method === UGCMethod.CodeDrop
                            ? 'Code Drop'
                            : 'In-Game'}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[2] }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🔢 Limit</p>
                      <p className="font-black text-xs mt-1" style={{ color: shuffledColors[2] }}>
                        {item.limitPerUser}x
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[3] }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📅 Release</p>
                      <p className="font-black text-xs mt-1 whitespace-nowrap" style={{ color: shuffledColors[3] }}>
                        {timers[item.id] === 'Unknown' ? '❓ Unknown' : (timers[item.id] || 'Loading...')}
                      </p>
                    </div>
                  </div>

                  {/* Code Display for CodeDrop items */}
                  {item.method === UGCMethod.CodeDrop && item.ugcCode && (
                    <div
                      className="mb-3 p-2 rounded-lg border-2 border-dashed flex flex-col items-center justify-center theme-bg-card"
                      style={{ borderColor: shuffledColors[1] }}
                    >
                      <p className="text-xs font-bold text-gray-500 uppercase">🔑 Code</p>
                      <p className="font-black text-lg tracking-widest select-all" style={{ color: shuffledColors[1] }}>
                        {item.ugcCode}
                      </p>
                    </div>
                  )}

                  <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200 flex-1 relative">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-1">📖 Info</p>
                    <p className="text-gray-700 text-xs font-medium break-words line-clamp-3 select-text cursor-text">
                      {item.instruction}
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-gray-50 to-transparent"></div>
                  </div>

                  <div className="mt-auto text-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Click for Details</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-2xl pop-in">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Items Found</h3>
            <p className="text-gray-600 text-lg font-semibold">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* --- DETAILED VIEWPORT MODAL --- */}
      {
        selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeModal}
            ></div>

            {/* Modal Content */}
            <div className="theme-bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 pop-in animate-float-up">

              {/* Modal Header Gradient */}
              <div
                className="h-24 w-full relative flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--theme-gradient-1), var(--theme-gradient-2), var(--theme-gradient-3), var(--theme-gradient-4))'
                }}
              >
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-all"
                >
                  ✕ Close
                </button>

                {/* Floating Image in Header */}
                <div className="absolute -bottom-12 p-2 theme-bg-card rounded-xl shadow-lg">
                  <img
                    src={selectedItem.imageUrl}
                    className="w-32 h-32 object-contain rounded-lg"
                    alt={selectedItem.title}
                  />
                </div>
              </div>

              <div className="pt-16 pb-8 px-8 text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-gray-900">{selectedItem.title}</h2>
                  <p className="text-gray-500 font-bold">by {selectedItem.creator}</p>
                </div>

                {/* Timer Large Display */}
                <div className="theme-bg-card rounded-xl p-4 inline-block border-2" style={{ borderColor: 'var(--theme-primary)' }}>
                  <p className="text-sm font-bold text-gray-500 uppercase">Status</p>
                  <p className="text-xl font-black" style={{ color: 'var(--theme-gradient-1)' }}>
                    {timers[selectedItem.id] || 'Updating...'}
                  </p>
                </div>

                {/* Full Description / Instruction */}
                <div className="theme-bg-card border-l-8 p-6 rounded-r-xl text-left" style={{ borderColor: 'var(--theme-gradient-2)' }}>
                  <h3 className="text-lg font-black text-gray-800 mb-2">Instructions & Details</h3>
                  <div className="text-gray-700 font-medium whitespace-pre-wrap leading-relaxed select-text cursor-text">
                    <ClickableInstructions text={selectedItem.instruction} color={'var(--theme-gradient-1)'} />
                  </div>
                </div>

                {/* Links Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {selectedItem.itemLink && (
                    <Link href={selectedItem.itemLink} target="_blank" className="w-full">
                      <button className="w-full py-4 bg-noob-pink text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                        🛍️ View on Roblox
                      </button>
                    </Link>
                  )}
                  {selectedItem.gameLink && (
                    <Link href={selectedItem.gameLink} target="_blank" className="w-full">
                      <button className="w-full py-4 bg-noob-purple text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                        🎮 Join Game
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* --- NEXT UP HUD (Minimizable) --- */}
      {
        nextUpItems.length > 0 && (
          <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-2">
            {/* Toggle Button */}
            <button
              onClick={() => setIsHudMinimized(!isHudMinimized)}
              className="px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/30 rounded-full text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider hover:bg-black/60 transition-all flex items-center gap-1"
            >
              {isHudMinimized ? (
                <>🚀 Show ({nextUpItems.length})</>
              ) : (
                <>✕ Hide</>
              )}
            </button>

            {/* HUD Content */}
            {!isHudMinimized && (
              <div className="flex flex-col gap-2 max-w-[280px] md:max-w-xs bg-black/40 backdrop-blur-xl border border-white/30 rounded-xl md:rounded-2xl p-2 md:p-3 shadow-2xl">
                <div className="text-white/70 text-xs font-bold uppercase tracking-wider text-right">
                  🚀 Next Up
                </div>
                {nextUpItems.map((item) => {
                  const gradientColors = gradients[item.id] || ['#b54eff', '#00d9ff', '#ff006e', '#ffbe0b'];
                  return (
                    <div
                      key={item.id}
                      onClick={() => openModal(item)}
                      className="cursor-pointer bg-white/10 hover:bg-white/20 rounded-lg p-2 flex items-center gap-2 md:gap-3 transition-all hover:scale-[1.02]"
                    >
                      <div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border-2 flex-shrink-0"
                        style={{ borderColor: gradientColors[0] }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-contain bg-white/10"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-xs md:text-sm truncate">{item.title}</p>
                        <p
                          className="text-xs font-bold"
                          style={{ color: gradientColors[0] }}
                        >
                          {timers[item.id] || 'Loading...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      }
    </div >
  );
}
