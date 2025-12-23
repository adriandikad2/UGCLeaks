'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ClickableInstructions, NoLinkTemplate } from '../InstructionParser';
import { useTheme } from '../components/ThemeContext';

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

const generateRandomGradient = () => {
  const colors = [
    '#ff006e', '#00d9ff', '#ffbe0b', '#00ff41', '#b54eff',
    '#ff8c42', '#ff1744', '#2196f3', '#667eea', '#764ba2',
    '#f093fb', '#4facfe'
  ];
  
  const shuffled = [...colors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
};

export default function LeaksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<UGCMethod | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'stock' | 'limit'>('recent');
  const [items, setItems] = useState<UGCItem[]>([]);
  const [scheduledItems, setScheduledItems] = useState<UGCItem[]>([]);
  const [gradients, setGradients] = useState<{ [key: string]: string[] }>({});

  // Use Global Theme Context
  const { isGrayscale, toggleTheme, buttonText } = useTheme(); 

  // Viewport/Modal States
  const [selectedItem, setSelectedItem] = useState<UGCItem | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Initialize mock data with random colors
    const mockItems: UGCItem[] = [
      {
        id: '1',
        title: 'Neon Glow Visor',
        itemName: 'Neon Glow Visor',
        creator: 'RobloxianCreations',
        creatorLink: 'https://www.roblox.com/users/1234567890/profile',
        stock: 500,
        releaseDateTime: '2025-12-24T10:00:00',
        method: UGCMethod.WebDrop,
        instruction: 'Visit https://www.roblox.com/catalog for drop information. Use code NEON2025 if prompted.',
        gameLink: 'https://www.roblox.com/games/123456',
        itemLink: 'https://www.roblox.com/catalog',
        imageUrl: 'https://placehold.co/400x400?text=Neon+Visor',
        limitPerUser: 3,
        color: generateRandomColor(),
      },
      {
        id: '2',
        title: 'Cosmic Backpack',
        itemName: 'Cosmic Backpack',
        creator: 'StyleMaster',
        creatorLink: 'https://www.roblox.com/users/9876543210/profile',
        stock: 250,
        releaseDateTime: '2025-12-25T15:30:00',
        method: UGCMethod.InGame,
        instruction: 'Join the game and visit the shop. Link: https://www.roblox.com/games/654321',
        gameLink: 'https://www.roblox.com/games/654321',
        itemLink: 'https://www.roblox.com/catalog/cosmic-backpack',
        imageUrl: 'https://placehold.co/400x400?text=Cosmic+Backpack',
        limitPerUser: 1,
        color: generateRandomColor(),
      },
      {
        id: '3',
        title: 'Diamond Crown',
        itemName: 'Diamond Crown',
        creator: 'LuxeDesigns',
        stock: 100,
        releaseDateTime: '2025-12-26T12:00:00',
        method: UGCMethod.WebDrop,
        instruction: 'Check the official announcements. More info at https://www.roblox.com/group-payment',
        gameLink: 'https://www.roblox.com/games/789456',
        itemLink: '',
        imageUrl: 'https://placehold.co/400x400?text=Diamond+Crown',
        limitPerUser: 2,
        color: generateRandomColor(),
      },
      {
        id: '4',
        title: 'Shadow Cloak',
        itemName: 'Shadow Cloak',
        creator: 'DarkArtist',
        creatorLink: 'https://www.roblox.com/users/5555555555/profile',
        stock: 300,
        releaseDateTime: '2025-12-27T08:00:00',
        method: UGCMethod.InGame,
        instruction: 'Available in-game. Join https://www.roblox.com/games/111222',
        gameLink: 'https://www.roblox.com/games/111222',
        itemLink: 'https://www.roblox.com/catalog/shadow-cloak',
        imageUrl: 'https://placehold.co/400x400?text=Shadow+Cloak',
        limitPerUser: 1,
        color: generateRandomColor(),
      },
      {
        id: '5',
        title: 'Flame Wings',
        itemName: 'Flame Wings',
        creator: 'FireCreator',
        stock: 'OUT OF STOCK',
        releaseDateTime: '2025-12-28T14:00:00',
        method: UGCMethod.WebDrop,
        instruction: 'Waiting for restock. See https://www.roblox.com/catalog for updates',
        gameLink: '',
        itemLink: '',
        imageUrl: 'https://placehold.co/400x400?text=Flame+Wings',
        limitPerUser: 5,
        color: generateRandomColor(),
      },
      {
        id: '6',
        title: 'Crystal Amulet',
        itemName: 'Crystal Amulet',
        creator: 'MysticArt',
        creatorLink: 'https://www.roblox.com/users/3333333333/profile',
        stock: 150,
        releaseDateTime: '2025-12-29T11:00:00',
        method: UGCMethod.InGame,
        instruction: 'Visit the mystical shop within the experience at https://www.roblox.com/games/333444',
        gameLink: 'https://www.roblox.com/games/333444',
        itemLink: 'https://www.roblox.com/catalog/crystal-amulet',
        imageUrl: 'https://placehold.co/400x400?text=Crystal+Amulet',
        limitPerUser: 2,
        color: generateRandomColor(),
      },
      {
        id: '7',
        title: 'Holographic Visor',
        itemName: 'Holographic Visor',
        creator: 'TechGenius',
        stock: 400,
        releaseDateTime: '2025-12-30T09:00:00',
        method: UGCMethod.WebDrop,
        instruction: 'Details coming soon. Check https://www.roblox.com for announcements',
        gameLink: 'https://www.roblox.com/games/555666',
        itemLink: '',
        imageUrl: 'https://placehold.co/400x400?text=Holographic+Visor',
        limitPerUser: 3,
        color: generateRandomColor(),
      },
      {
        id: '8',
        title: 'Celestial Halo',
        itemName: 'Celestial Halo',
        creator: 'StarDesigner',
        creatorLink: 'https://www.roblox.com/users/7777777777/profile',
        stock: 200,
        releaseDateTime: '2025-12-31T16:00:00',
        method: UGCMethod.InGame,
        instruction: 'New Year special event. Join https://www.roblox.com/games/777888 to participate',
        gameLink: 'https://www.roblox.com/games/777888',
        itemLink: 'https://www.roblox.com/catalog/celestial-halo',
        imageUrl: 'https://placehold.co/400x400?text=Celestial+Halo',
        limitPerUser: 1,
        color: generateRandomColor(),
      },
      {
        id: '9',
        title: 'Phantom Mask',
        itemName: 'Phantom Mask',
        creator: 'MysteryCreator',
        stock: 75,
        releaseDateTime: '2026-01-01T10:00:00',
        method: UGCMethod.WebDrop,
        instruction: 'Secret drop announcement at https://www.roblox.com. Password required.',
        gameLink: '',
        itemLink: 'https://www.roblox.com/catalog/phantom-mask',
        imageUrl: 'https://placehold.co/400x400?text=Phantom+Mask',
        limitPerUser: 1,
        color: generateRandomColor(),
      },
      {
        id: '10',
        title: 'Golden Gauntlets',
        itemName: 'Golden Gauntlets',
        creator: 'LuxeCreator',
        creatorLink: 'https://www.roblox.com/users/9999999999/profile',
        stock: 500,
        releaseDateTime: '2026-01-02T13:00:00',
        method: UGCMethod.InGame,
        instruction: 'Limited run event. Check https://www.roblox.com/games/999111 for details',
        gameLink: 'https://www.roblox.com/games/999111',
        itemLink: 'https://www.roblox.com/catalog/golden-gauntlets',
        imageUrl: 'https://placehold.co/400x400?text=Golden+Gauntlets',
        limitPerUser: 2,
        color: generateRandomColor(),
      },
    ];

    setItems(mockItems);

    // Load scheduled items from API
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
          const newGradients: { [key: string]: string[] } = {};
          converted.forEach((item: any) => {
            newGradients[item.id] = generateRandomGradient();
          });
          setGradients(prev => ({ ...prev, ...newGradients }));
        }
      } catch (error) {
        console.error('Failed to load scheduled items from API:', error);
      }
    };

    loadScheduledItems();

    // Generate gradients for mock items
    const newGradients: { [key: string]: string[] } = {};
    mockItems.forEach(item => {
      newGradients[item.id] = generateRandomGradient();
    });
    setGradients(newGradients);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const allItems = [...items, ...scheduledItems];
      const newTimers: { [key: string]: string } = {};

      allItems.forEach(item => {
        const releaseTime = new Date(item.releaseDateTime).getTime();
        const nowTime = new Date().getTime();
        const diff = releaseTime - nowTime;

        if (diff > 0) {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          if (days > 0) newTimers[item.id] = `${days}d ${hours}h away`;
          else if (hours > 0) newTimers[item.id] = `${hours}h ${mins}m away`;
          else newTimers[item.id] = `${mins}m away`;
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
      if (sortBy === 'recent') {
        return new Date(b.releaseDateTime).getTime() - new Date(a.releaseDateTime).getTime();
      }
      if (sortBy === 'stock') {
        const stockA = typeof a.stock === 'number' ? a.stock : -1;
        const stockB = typeof b.stock === 'number' ? b.stock : -1;
        return stockB - stockA;
      }
      if (sortBy === 'limit') {
        return b.limitPerUser - a.limitPerUser;
      }
      return 0;
    });

  const openModal = (item: UGCItem) => {
    setSelectedItem(item);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'unset';
  };

  return (
    <div className={`min-h-screen p-6 md:p-10 transition-all duration-700 ${isGrayscale ? 'grayscale bg-gray-900' : ''}`}>
      
      {/* --- GLOBAL THEME BUTTON (Synced) --- */}
      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-40 px-6 py-2 rounded-full border-2 border-white/50 bg-black/20 backdrop-blur-md text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300 group"
      >
        <span className="animate-pulse group-hover:animate-none">
          {buttonText}
        </span>
      </button>

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
          <Link href="/schedule">
            <button className="px-8 py-4 bg-gradient-to-r from-roblox-purple to-roblox-pink text-white font-black rounded-xl blocky-shadow-hover text-lg uppercase tracking-wide hover:scale-105 transition-all">
              📅 Create Schedule
            </button>
          </Link>
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'stock' | 'limit')}
              className="w-full px-4 py-3 rounded-lg border-4 border-roblox-purple font-bold text-gray-900 focus:outline-none"
            >
              <option value="recent">⏱️ Most Recent</option>
              <option value="stock">📦 Most Stock</option>
              <option value="limit">🔢 Highest Limit</option>
            </select>
          </div>
        </div>

        {/* --- GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredItems.map((item) => {
            const gradient = gradients[item.id];
            const gradientStr = gradient
              ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]}, ${gradient[2]}, ${gradient[3]})`
              : 'linear-gradient(135deg, #ff006e, #00d9ff)';
            const outlineColor = item.color || '#ff006e';

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
                    background: gradientStr,
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
                      style={{ backgroundColor: (gradient?.[0] || outlineColor) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📦 Stock</p>
                      <p className="font-black text-xs mt-1" style={{ color: gradient?.[0] || outlineColor }}>
                        {typeof item.stock === 'number' ? item.stock : 'OUT'}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[1] || outlineColor) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🎯 Method</p>
                      <p className="font-black text-xs mt-1 line-clamp-2" style={{ color: gradient?.[1] || outlineColor }}>
                        {item.method === UGCMethod.WebDrop ? 'Web Drop' : 'In-Game'}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[2] || outlineColor) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🔢 Limit</p>
                      <p className="font-black text-xs mt-1" style={{ color: gradient?.[2] || outlineColor }}>
                        {item.limitPerUser}x
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[3] || outlineColor) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📅 Release</p>
                      <p className="font-black text-xs mt-1 whitespace-nowrap" style={{ color: gradient?.[3] || outlineColor }}>
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
    </div>
  );
}
