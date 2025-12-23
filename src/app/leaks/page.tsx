'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ClickableInstructions, NoLinkTemplate } from '../InstructionParser';

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
  releaseTime: string;
  method: UGCMethod;
  instruction: string;
  gameLink: string;
  itemLink: string;
  imageUrl: string;
  limitPerUser: number;
  color: string;
};

const generateRandomGradient = () => {
  const colors = [
    '#ff006e',
    '#00d9ff',
    '#ffbe0b',
    '#00ff41',
    '#b54eff',
    '#ff8c42',
    '#ff1744',
    '#2196f3',
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe'
  ];
  
  const shuffled = [...colors].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
};

const convertTimeToSortable = (timeStr: string): number => {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|EST)/i);
  if (!match) return 0;
  
  let [_, hour, minute, period] = match;
  let hourNum = parseInt(hour);
  const minuteNum = parseInt(minute);
  
  if (period === 'PM' && hourNum !== 12) {
    hourNum += 12;
  } else if (period === 'AM' && hourNum === 12) {
    hourNum = 0;
  }
  
  return hourNum * 100 + minuteNum;
};

export default function LeaksPage() {
  const [cardGradients, setCardGradients] = useState<{ [key: string]: string[] }>({});

  const [ugcItems] = useState<UGCItem[]>([
    {
      id: '1',
      title: 'Red Valkyrie Helm',
      itemName: 'Red Valkyrie Helm',
      creator: 'RobloxianCreations',
      creatorLink: 'https://www.roblox.com/users/123456/profile',
      stock: 1500,
      releaseTime: '5:00 PM EST',
      method: UGCMethod.WebDrop,
      instruction: 'Purchase directly from the catalog when available at https://www.roblox.com/catalog/123456789/item',
      gameLink: 'https://www.roblox.com/games/123456789/game',
      itemLink: 'https://www.roblox.com/catalog/123456789/item',
      imageUrl: 'https://placehold.co/400x400?text=Red+Valkyrie+Helm',
      limitPerUser: 1,
      color: '#ff006e',
    },
    {
      id: '2',
      title: 'Cyber Knight Armor',
      itemName: 'Cyber Knight Armor',
      creator: 'PixelWarriors',
      creatorLink: 'https://www.roblox.com/users/234567/profile',
      stock: 750,
      releaseTime: '3:30 PM EST',
      method: UGCMethod.InGame,
      instruction: 'Join game and survive for 30 minutes to unlock the item',
      gameLink: '',
      itemLink: '',
      imageUrl: 'https://placehold.co/400x400?text=Cyber+Knight+Armor',
      limitPerUser: 1,
      color: '#00d9ff',
    },
    {
      id: '3',
      title: 'Neon Wings',
      itemName: 'Neon Wings',
      creator: 'GlowUpStudio',
      creatorLink: 'https://www.roblox.com/users/345678/profile',
      stock: 'OUT OF STOCK',
      releaseTime: '1:15 PM EST',
      method: UGCMethod.WebDrop,
      instruction: 'Visit https://www.roblox.com/catalog/456789123/item when available for purchase',
      gameLink: 'https://www.roblox.com/games/456789123/game',
      itemLink: 'https://www.roblox.com/catalog/456789123/item',
      imageUrl: 'https://placehold.co/400x400?text=Neon+Wings',
      limitPerUser: 1,
      color: '#ffbe0b',
    },
    {
      id: '4',
      title: 'Dragon Lord Sword',
      itemName: 'Dragon Lord Sword',
      creator: 'FantasyForge',
      creatorLink: 'https://www.roblox.com/users/456789/profile',
      stock: 300,
      releaseTime: '11:45 AM EST',
      method: UGCMethod.InGame,
      instruction: 'Complete the dragon quest in the game at https://www.roblox.com/games/789123456/game to earn the sword',
      gameLink: 'https://www.roblox.com/games/789123456/game',
      itemLink: 'https://www.roblox.com/catalog/789123456/item',
      imageUrl: 'https://placehold.co/400x400?text=Dragon+Lord+Sword',
      limitPerUser: 5,
      color: '#00ff41',
    },
    {
      id: '5',
      title: 'Mystic Crown',
      itemName: 'Mystic Crown',
      creator: 'MysticCreations',
      creatorLink: 'https://www.roblox.com/users/567890/profile',
      stock: 100,
      releaseTime: 'Unknown',
      method: UGCMethod.Unknown,
      instruction: 'Details coming soon. Check back for updates',
      gameLink: '',
      itemLink: '',
      imageUrl: 'https://placehold.co/400x400?text=Mystic+Crown',
      limitPerUser: 1,
      color: '#b54eff',
    },
  ]);

  useEffect(() => {
    const gradients: { [key: string]: string[] } = {};
    ugcItems.forEach(item => {
      gradients[item.id] = generateRandomGradient();
    });
    setCardGradients(gradients);
  }, [ugcItems]);

  const [methodFilter, setMethodFilter] = useState<UGCMethod | 'All'>('All');
  const [sortBy, setSortBy] = useState<'time' | 'method'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const filteredAndSortedItems = ugcItems
    .filter(item => methodFilter === 'All' || item.method === methodFilter)
    .sort((a, b) => {
      if (sortBy === 'time') {
        if (a.releaseTime === 'Unknown' && b.releaseTime !== 'Unknown') return sortOrder === 'asc' ? 1 : -1;
        if (a.releaseTime !== 'Unknown' && b.releaseTime === 'Unknown') return sortOrder === 'asc' ? -1 : 1;
        if (a.releaseTime === 'Unknown' && b.releaseTime === 'Unknown') return 0;
        
        const timeA = convertTimeToSortable(a.releaseTime);
        const timeB = convertTimeToSortable(b.releaseTime);
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        return sortOrder === 'asc' 
          ? a.method.localeCompare(b.method) 
          : b.method.localeCompare(a.method);
      }
    });

  return (
    <div className="min-h-screen py-12 relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="mb-12 text-center space-y-4 pop-in">
          <h1 className="text-6xl md:text-7xl font-black rainbow-text drop-shadow-2xl">
            🎯 UGC LEAKS 🎯
          </h1>
          <p className="text-xl md:text-2xl text-white font-bold drop-shadow-lg">Track the latest Roblox limited items in real-time</p>
          <div className="h-1 w-96 mx-auto bg-gradient-to-r from-roblox-pink via-roblox-cyan to-roblox-yellow rounded-full glow-pink"></div>
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <Link href="/schedule" passHref>
            <button className="px-8 py-4 bg-gradient-to-r from-roblox-purple to-roblox-pink text-white font-black rounded-xl blocky-shadow-hover text-lg uppercase tracking-wide hover:scale-105 transition-all">
              📅 Create Schedule
            </button>
          </Link>
        </div>
        
        <div className="mb-12 p-6 md:p-8 bg-white rounded-2xl shadow-2xl blocky-shadow space-y-6">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">⚙️ Filter & Sort Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">📋 Filter by Method</label>
              <select 
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as UGCMethod | 'All')}
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-pink font-bold text-gray-900 focus:outline-none focus:border-roblox-cyan transition-colors"
              >
                <option value="All">All Methods</option>
                <option value={UGCMethod.WebDrop}>🌐 Web Drop</option>
                <option value={UGCMethod.InGame}>🎮 In-Game</option>
                <option value={UGCMethod.Unknown}>❓ Unknown</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">📊 Sort by</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'time' | 'method')}
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-cyan font-bold text-gray-900 focus:outline-none focus:border-roblox-pink transition-colors"
              >
                <option value="time">⏰ Time</option>
                <option value="method">🎯 Method</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">📈 Sort Order</label>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-yellow font-bold text-gray-900 focus:outline-none focus:border-roblox-purple transition-colors"
              >
                <option value="asc">⬆️ Ascending</option>
                <option value="desc">⬇️ Descending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedItems.map((item, idx) => {
            const gradient = cardGradients[item.id];
            const gradientStr = gradient
              ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]}, ${gradient[2]}, ${gradient[3]})`
              : `linear-gradient(135deg, ${item.color}, ${item.color}dd)`;

            return (
              <div 
                key={item.id}
                className="pop-in bg-white rounded-xl overflow-hidden border-4 shadow-2xl blocky-shadow-hover flex flex-col h-full transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: gradient?.[0] || item.color,
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <div 
                  className="h-3 w-full"
                  style={{
                    background: gradientStr,
                    backgroundSize: '400% 400%',
                    animation: 'random-gradient 6s ease infinite',
                  }}
                ></div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-center mb-4">
                    <div 
                      className="p-4 rounded-lg border-4"
                      style={{ borderColor: gradient?.[0] || item.color, backgroundColor: (gradient?.[0] || item.color) + '15' }}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.itemName}
                        className="w-32 h-32 object-contain rounded"
                        width={128}
                        height={128}
                      />
                    </div>
                  </div>
                  
                  <Link href={item.itemLink} target="_blank" rel="noopener noreferrer">
                    <h2 
                      className="text-2xl font-black text-gray-900 mb-1 text-center hover:underline cursor-pointer transition-all"
                      style={{ color: gradient?.[0] || item.color }}
                    >
                      {item.title}
                    </h2>
                  </Link>

                  <p className="text-center text-sm font-bold text-gray-600 mb-4">
                    by{' '}
                    {item.creatorLink ? (
                      <Link href={item.creatorLink} target="_blank" rel="noopener noreferrer">
                        <span 
                          className="hover:underline cursor-pointer"
                          style={{ color: gradient?.[1] || item.color }}
                        >
                          {item.creator}
                        </span>
                      </Link>
                    ) : (
                      <span style={{ color: gradient?.[1] || item.color }}>
                        {item.creator}
                      </span>
                    )}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div 
                      className="p-3 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[0] || item.color) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">📦 Stock</p>
                      <p className={`font-black text-sm mt-1 ${item.stock === 'OUT OF STOCK' ? 'text-red-600' : ''}`} style={{ color: item.stock === 'OUT OF STOCK' ? '#ff1744' : (gradient?.[0] || item.color) }}>
                        {item.stock === 'OUT OF STOCK' ? '❌ OUT' : `${item.stock}`}
                      </p>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[1] || item.color) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">⏰ Time</p>
                      <p className="font-black text-sm mt-1" style={{ color: gradient?.[1] || item.color }}>{item.releaseTime}</p>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[2] || item.color) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🎯 Method</p>
                      <p className="font-black text-sm mt-1" style={{ color: gradient?.[2] || item.color }}>
                        {item.method === UGCMethod.WebDrop ? '🌐 Web' : item.method === UGCMethod.InGame ? '🎮 Game' : '❓'}
                      </p>
                    </div>
                    
                    <div 
                      className="p-3 rounded-lg border-2 border-gray-300"
                      style={{ backgroundColor: (gradient?.[3] || item.color) + '15' }}
                    >
                      <p className="text-xs font-bold text-gray-600 uppercase">🔢 Limit</p>
                      <p className="font-black text-sm mt-1" style={{ color: gradient?.[3] || item.color }}>{item.limitPerUser}x</p>
                    </div>
                  </div>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">🎮 Game Link</p>
                    {item.gameLink ? (
                      <Link href={item.gameLink} target="_blank" rel="noopener noreferrer">
                        <p className="text-blue-600 text-sm font-bold hover:underline cursor-pointer break-all">
                          {item.gameLink}
                        </p>
                      </Link>
                    ) : (
                      <NoLinkTemplate color={gradient?.[0] || '#ff006e'} />
                    )}
                  </div>

                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">📖 How to Get It</p>
                    <p className="text-gray-700 text-sm font-medium break-words">
                      <ClickableInstructions text={item.instruction} color={gradient?.[1] || item.color} />
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 mt-auto">
                    {item.itemLink ? (
                      <Link href={item.itemLink} target="_blank" rel="noopener noreferrer" className="w-full">
                        <button 
                          className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                          style={{
                            background: `linear-gradient(135deg, ${gradient?.[0] || item.color}, ${gradient?.[1] || item.color})`,
                            backgroundSize: '400% 400%',
                            boxShadow: `0 6px 20px ${gradient?.[0] || item.color}80`
                          }}
                        >
                          🛍️ View Item
                        </button>
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="w-full px-4 py-3 text-gray-400 font-black rounded-lg text-sm uppercase tracking-wide bg-gray-300 cursor-not-allowed"
                      >
                        🛍️ Item Not Available
                      </button>
                    )}
                    {item.gameLink ? (
                      <Link href={item.gameLink} target="_blank" rel="noopener noreferrer" className="w-full">
                        <button 
                          className="w-full px-4 py-3 text-gray-900 font-black rounded-lg border-3 transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                          style={{
                            borderColor: gradient?.[2] || item.color,
                            backgroundColor: (gradient?.[2] || item.color) + '20',
                            color: gradient?.[2] || item.color
                          }}
                        >
                          🎮 Join Game
                        </button>
                      </Link>
                    ) : (
                      <button 
                        disabled
                        className="w-full px-4 py-3 text-gray-400 font-black rounded-lg border-3 text-sm uppercase tracking-wide bg-gray-200 cursor-not-allowed border-gray-400"
                      >
                        🎮 Game Not Available
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSortedItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-2xl pop-in">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Leaks Found</h3>
            <p className="text-gray-600 text-lg font-semibold">Try adjusting your filters to see more items</p>
          </div>
        )}
      </div>
    </div>
  );
}
