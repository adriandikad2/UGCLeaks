'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClickableInstructions, NoLinkTemplate } from '../InstructionParser';
import { useTheme } from '../components/ThemeContext';
import { hasAccess, isAuthenticated, signout, getUserRole } from '@/lib/auth';
import { ToastContainer, useToast } from '@/app/Toast';

enum UGCMethod {
  WebDrop = 'Web Drop',
  InGame = 'In-Game',
  Unknown = 'Unknown'
}

type UGCItem = {
  id: string;
  title: string;
  itemName: string;
  creator: string;
  creatorLink?: string;
  stock: number | 'OUT OF STOCK';
  releaseDateTime: string;
  method: UGCMethod;
  instruction: string;
  gameLink: string;
  itemLink: string;
  imageUrl: string;
  limitPerUser: number;
  color?: string;
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

const generateRandomGradient = (id: string) => {
  const colors = [
    '#ff006e', '#00d9ff', '#ffbe0b', '#00ff41', '#b54eff',
    '#ff8c42', '#ff1744', '#2196f3', '#667eea', '#764ba2',
    '#f093fb', '#4facfe'
  ];

  // Use seeded sort for deterministic shuffling
  const shuffled = [...colors].sort((a, b) => {
    const seedA = seededRandom(id + a);
    const seedB = seededRandom(id + b);
    return seedA - seedB;
  });
  return shuffled.slice(0, 4);
};

export default function LeaksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<UGCMethod | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'stock' | 'limit' | 'upcoming'>('upcoming');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [items, setItems] = useState<UGCItem[]>([]);
  const [scheduledItems, setScheduledItems] = useState<UGCItem[]>([]);
  const [gradients, setGradients] = useState<{ [key: string]: string[] }>({});
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [authenticated, setAuthenticated] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  // Hooks
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  const { isGrayscale, toggleTheme, buttonText } = useTheme();

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    setIsEditor(hasAccess('editor'));
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
          creatorLink: item.creator_link,
          stock: item.stock,
          releaseDateTime: item.release_date_time,
          method: item.method,
          instruction: item.instruction,
          gameLink: item.game_link,
          itemLink: item.item_link,
          imageUrl: item.image_url,
          limitPerUser: item.limit_per_user,
          color: item.color,
        }));
        setScheduledItems(converted);

        // Generate gradients for scheduled items
        const apiGradients: { [key: string]: string[] } = {};
        converted.forEach((item: any) => {
          apiGradients[item.id] = generateRandomGradient(item.id);
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

        const releaseTime = new Date(item.releaseDateTime).getTime();
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

  const filteredItems = [...items, ...scheduledItems]
    .filter(item => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = filterMethod === 'All' || item.method === filterMethod;
      return matchesSearch && matchesMethod;
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
      {/* --- THEME & AUTH CONTROLS --- */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-40 flex gap-2 md:gap-3">
        <button
          onClick={toggleTheme}
          className="px-3 py-1.5 md:px-6 md:py-2 text-xs md:text-sm rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300 group"
        >
          <span className="animate-pulse group-hover:animate-none">
            {buttonText}
          </span>
        </button>
      </div>

      {/* --- NAVIGATION BUTTONS --- */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-40 flex gap-2 md:gap-3">
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

      {/* --- TOAST NOTIFICATIONS --- */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4 pop-in">
          <h1 className="text-5xl md:text-6xl font-black rainbow-text drop-shadow-2xl">
            🔥 UGC LEAKS 🔥
          </h1>
          <div className="h-2 w-80 mx-auto bg-gradient-to-r from-roblox-pink via-roblox-cyan to-roblox-yellow rounded-full glow-pink blocky-shadow"></div>
          <p className="text-white text-lg md:text-xl drop-shadow-lg">
            Track the hottest upcoming Roblox UGC drops
          </p>
        </div>

        <div className="flex justify-center">
          {isEditor && (
            <button
              onClick={() => router.push('/schedule')}
              className="px-8 py-4 bg-gradient-to-r from-roblox-purple to-roblox-pink text-white font-black rounded-xl blocky-shadow-hover text-lg uppercase tracking-wide hover:scale-105 transition-all"
            >
              📅 Create Schedule
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-white font-bold uppercase text-sm">🔍 Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Item, creator, name..."
              className="w-full px-4 py-3 rounded-lg border-4 border-roblox-cyan font-bold text-gray-900 focus:outline-none focus:border-roblox-pink"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-bold uppercase text-sm">🎯 Method</label>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value as UGCMethod | 'All')}
              className="w-full px-4 py-3 rounded-lg border-4 border-roblox-yellow font-bold text-gray-900 focus:outline-none"
            >
              <option value="All">All Methods</option>
              <option value={UGCMethod.WebDrop}>🌐 Web Drop</option>
              <option value={UGCMethod.InGame}>🎮 In-Game</option>
              <option value={UGCMethod.Unknown}>❓ Unknown</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-white font-bold uppercase text-sm">📊 Sort</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'stock' | 'limit' | 'upcoming')}
                className="flex-1 px-4 py-3 rounded-lg border-4 border-roblox-purple font-bold text-gray-900 focus:outline-none"
              >
                <option value="upcoming">🚀 Next Up</option>
                <option value="recent">⏱️ Most Recent</option>
                <option value="stock">📦 Most Stock</option>
                <option value="limit">🔢 Highest Limit</option>
              </select>
              <button
                onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 rounded-lg border-4 border-roblox-purple bg-white font-bold text-gray-900 hover:bg-roblox-purple hover:text-white transition-all"
                title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-3 rounded-lg border-4 border-roblox-cyan bg-white font-bold text-gray-900 hover:bg-roblox-cyan hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh items"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredItems.map((item) => {
            const gradientColors = isMounted ? gradients[item.id] : ['#ccc', '#ccc', '#ccc', '#ccc'];
            const gradientStr = gradientColors
              ? `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]}, ${gradientColors[2]}, ${gradientColors[3]})`
              : 'linear-gradient(135deg, #ccc, #ccc)';
            const outlineColor = gradientColors ? gradientColors[0] : '#ccc';

            return (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="cursor-pointer pop-in bg-white rounded-xl overflow-hidden border-4 shadow-2xl blocky-shadow-hover flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ borderColor: outlineColor }}
              >
                <div
                  className="h-3 w-full"
                  style={{
                    backgroundImage: gradientStr,
                    backgroundSize: '400% 400%',
                    animation: 'random-gradient 6s ease infinite',
                  }}
                ></div>

                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-center mb-3">
                    <div
                      className="p-3 rounded-lg border-3"
                      style={{
                        borderColor: outlineColor,
                        backgroundColor: outlineColor + '15',
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
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: gradientColors[0] + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📦 Stock</p>
                      <p className="font-black text-xs mt-1" style={{ color: gradientColors[0] || outlineColor }}>
                        {typeof item.stock === 'number' ? item.stock : 'OUT'}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: gradientColors[1] + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🎯 Method</p>
                      <p className="font-black text-xs mt-1 line-clamp-2" style={{ color: gradientColors[1] || outlineColor }}>
                        {item.method === UGCMethod.WebDrop ? 'Web Drop' : 'In-Game'}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: gradientColors[2] + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🔢 Limit</p>
                      <p className="font-black text-xs mt-1" style={{ color: gradientColors[2] || outlineColor }}>
                        {item.limitPerUser}x
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: gradientColors[3] + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📅 Release</p>
                      <p className="font-black text-xs mt-1 whitespace-nowrap" style={{ color: gradientColors[3] || outlineColor }}>
                        {timers[item.id] || 'Loading...'}
                      </p>
                    </div>
                  </div>

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
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 pop-in animate-float-up">

            {/* Modal Header Gradient */}
            <div
              className="h-24 w-full relative flex items-center justify-center"
              style={{
                background: gradients[selectedItem.id]
                  ? `linear-gradient(135deg, ${gradients[selectedItem.id].join(', ')})`
                  : selectedItem.color
              }}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-all"
              >
                ✕ Close
              </button>

              {/* Floating Image in Header */}
              <div className="absolute -bottom-12 p-2 bg-white rounded-xl shadow-lg">
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
              <div className="bg-gray-100 rounded-xl p-4 inline-block">
                <p className="text-sm font-bold text-gray-500 uppercase">Status</p>
                <p className="text-xl font-black text-roblox-purple">
                  {timers[selectedItem.id] || 'Updating...'}
                </p>
              </div>

              {/* Full Description / Instruction */}
              <div className="bg-blue-50 border-l-8 border-roblox-cyan p-6 rounded-r-xl text-left">
                <h3 className="text-lg font-black text-gray-800 mb-2">Instructions & Details</h3>
                <div className="text-gray-700 font-medium whitespace-pre-wrap leading-relaxed select-text cursor-text">
                  {/* This allows full visibility of the description */}
                  <ClickableInstructions text={selectedItem.instruction} color={selectedItem.color || '#000'} />
                </div>
              </div>

              {/* Links Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                {selectedItem.itemLink && (
                  <Link href={selectedItem.itemLink} target="_blank" className="w-full">
                    <button className="w-full py-4 bg-roblox-pink text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                      🛍️ View on Roblox
                    </button>
                  </Link>
                )}
                {selectedItem.gameLink && (
                  <Link href={selectedItem.gameLink} target="_blank" className="w-full">
                    <button className="w-full py-4 bg-roblox-purple text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                      🎮 Join Game
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEXT UP HUD --- */}
      {nextUpItems.length > 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex flex-col gap-2 max-w-[280px] md:max-w-xs">
          <div className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1 text-right">
            🚀 Next Up
          </div>
          {nextUpItems.map((item) => {
            const gradientColors = gradients[item.id] || ['#b54eff', '#00d9ff', '#ff006e', '#ffbe0b'];
            return (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="cursor-pointer bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 hover:bg-white/20 transition-all hover:scale-[1.02] shadow-lg"
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
  );
}
