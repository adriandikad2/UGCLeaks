'use client';

import Link from 'next/link';
import { useState } from 'react';

// Define the type for our UGC item
type UGCItem = {
  id: string;
  title: string;
  itemName: string;
  creator: string;
 stock: number | 'OUT OF STOCK';
  releaseTime: string; // EST time
  method: 'Web Drop' | 'In-Game';
  instruction: string;
  gameLink: string;
  itemLink: string;
  imageUrl: string;
};

export default function TodaysLeaks() {
  // Mock data for UGC items
  const [ugcItems] = useState<UGCItem[]>([
    {
      id: '1',
      title: 'Red Valkyrie Helm',
      itemName: 'Red Valkyrie Helm',
      creator: 'RobloxianCreations',
      stock: 1500,
      releaseTime: '5:00 PM EST',
      method: 'Web Drop',
      instruction: 'Purchase directly from the catalog when available',
      gameLink: 'https://www.roblox.com/games/123456789/game',
      itemLink: 'https://www.roblox.com/catalog/123456789/item',
      imageUrl: 'https://placehold.co/400x400?text=Red+Valkyrie+Helm',
    },
    {
      id: '2',
      title: 'Cyber Knight Armor',
      itemName: 'Cyber Knight Armor',
      creator: 'PixelWarriors',
      stock: 750,
      releaseTime: '3:30 PM EST',
      method: 'In-Game',
      instruction: 'Join game and survive for 30 minutes',
      gameLink: 'https://www.roblox.com/games/987654321/game',
      itemLink: 'https://www.roblox.com/catalog/987654321/item',
      imageUrl: 'https://placehold.co/400x400?text=Cyber+Knight+Armor',
    },
    {
      id: '3',
      title: 'Neon Wings',
      itemName: 'Neon Wings',
      creator: 'GlowUpStudio',
      stock: 'OUT OF STOCK',
      releaseTime: '1:15 PM EST',
      method: 'Web Drop',
      instruction: 'Purchase directly from the catalog when available',
      gameLink: 'https://www.roblox.com/games/456789123/game',
      itemLink: 'https://www.roblox.com/catalog/456789123/item',
      imageUrl: 'https://placehold.co/400x400?text=Neon+Wings',
    },
    {
      id: '4',
      title: 'Dragon Lord Sword',
      itemName: 'Dragon Lord Sword',
      creator: 'FantasyForge',
      stock: 300,
      releaseTime: '11:45 AM EST',
      method: 'In-Game',
      instruction: 'Complete the dragon quest in the game',
      gameLink: 'https://www.roblox.com/games/789123456/game',
      itemLink: 'https://www.roblox.com/catalog/789123456/item',
      imageUrl: 'https://placehold.co/400x400?text=Dragon+Lord+Sword',
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Today's UGC Leaks</h1>
          <p className="text-gray-600">Track the latest Roblox limited items</p>
        </div>

        <div className="space-y-6">
          {ugcItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                {/* Item Header */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.itemName}
                      className="w-32 h-32 object-contain rounded-lg border border-gray-200"
                      width={128}
                      height={128}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{item.title}</h2>
                    <p className="text-gray-600 mb-2">by {item.creator}</p>
                    
                    {/* Critical Drop Data */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Stock</p>
                        <p className={`font-semibold ${item.stock === 'OUT OF STOCK' ? 'text-red-600' : 'text-gray-900'}`}>
                          {item.stock === 'OUT OF STOCK' ? 'OUT OF STOCK' : `Stock: ${item.stock}`}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                        <p className="font-semibold text-gray-900">{item.releaseTime}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Method</p>
                        <p className="font-semibold text-gray-900">{item.method}</p>
                      </div>
                    </div>
                    
                    {/* Instructions */}
                    <div className="mb-6">
                      <p className="text-sm text-gray-50 uppercase tracking-wide mb-1">How to Get It</p>
                      <p className="text-gray-700">{item.instruction}</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={item.gameLink} target="_blank" rel="noopener noreferrer">
                        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
                          Join Game
                        </button>
                      </Link>
                      <Link href={item.itemLink} target="_blank" rel="noopener noreferrer">
                        <button className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors duration-300">
                          View Item
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}