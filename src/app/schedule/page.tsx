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
  releaseDateTime: string;
  method: UGCMethod;
  instruction: string;
  gameLink: string;
  itemLink: string;
  imageUrl: string;
  limitPerUser: number;
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

export default function SchedulePage() {
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [formData, setFormData] = useState<UGCItem>({
    id: Math.random().toString(),
    title: '',
    itemName: '',
    creator: '',
    creatorLink: '',
    stock: 1000,
    releaseDateTime: new Date().toISOString().slice(0, 16),
    method: UGCMethod.WebDrop,
    instruction: '',
    gameLink: '',
    itemLink: '',
    imageUrl: 'https://placehold.co/400x400?text=New+Item',
    limitPerUser: 1,
  });

  const [scheduledItems, setScheduledItems] = useState<UGCItem[]>([]);
  const [gradients, setGradients] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    // Set user timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);
  }, []);

  const handleAddSchedule = () => {
    if (!formData.title || !formData.creator) {
      alert('Please fill in title and creator');
      return;
    }

    const newItem = {
      ...formData,
      id: Math.random().toString(),
    };

    setScheduledItems([...scheduledItems, newItem]);
    setGradients({
      ...gradients,
      [newItem.id]: generateRandomGradient(),
    });

    // Reset form
    setFormData({
      id: Math.random().toString(),
      title: '',
      itemName: '',
      creator: '',
      creatorLink: '',
      stock: 1000,
      releaseDateTime: new Date().toISOString().slice(0, 16),
      method: UGCMethod.WebDrop,
      instruction: '',
      gameLink: '',
      itemLink: '',
      imageUrl: 'https://placehold.co/400x400?text=New+Item',
      limitPerUser: 1,
    });
  };

  const handleRemoveSchedule = (id: string) => {
    setScheduledItems(scheduledItems.filter(item => item.id !== id));
    const newGradients = { ...gradients };
    delete newGradients[id];
    setGradients(newGradients);
  };

  const handleFormChange = (field: keyof UGCItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatRelativeTime = (dateTimeString: string): string => {
    try {
      const releaseDate = new Date(dateTimeString);
      const now = new Date();
      const diff = releaseDate.getTime() - now.getTime();

      if (diff < 0) return 'Already dropped';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m ${seconds}s`;
    } catch {
      return 'Invalid time';
    }
  };

  const formatLocalDateTime = (dateTimeString: string): string => {
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen py-12 relative">
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center space-y-4 pop-in">
          <h1 className="text-6xl md:text-7xl font-black rainbow-text drop-shadow-2xl">
            📅 SCHEDULE DROPS
          </h1>
          <p className="text-xl md:text-2xl text-white font-bold drop-shadow-lg">
            Create and manage upcoming UGC releases
          </p>
          <p className="text-lg text-white font-semibold drop-shadow-md">
            Timezone: {userTimezone}
          </p>
          <div className="h-1 w-96 mx-auto bg-gradient-to-r from-roblox-pink via-roblox-cyan to-roblox-yellow rounded-full glow-pink"></div>
        </div>

        <Link href="/leaks" passHref>
          <button className="mb-8 px-6 py-3 bg-white text-gray-900 font-bold rounded-lg blocky-shadow hover:scale-105 transition-all">
            ← Back to Leaks
          </button>
        </Link>

        {/* Creation Form */}
        <div className="mb-12 p-8 bg-white rounded-2xl shadow-2xl blocky-shadow space-y-6">
          <h2 className="text-3xl font-black text-gray-900">➕ Create New Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Item Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="e.g., Red Valkyrie Helm"
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-pink font-bold text-gray-900 focus:outline-none focus:border-roblox-cyan"
              />
            </div>

            {/* Creator */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Creator Name</label>
              <input
                type="text"
                value={formData.creator}
                onChange={(e) => handleFormChange('creator', e.target.value)}
                placeholder="e.g., RobloxianCreations"
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-cyan font-bold text-gray-900 focus:outline-none focus:border-roblox-pink"
              />
            </div>

            {/* Creator Profile Link */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Creator Profile Link</label>
              <input
                type="url"
                value={formData.creatorLink}
                onChange={(e) => handleFormChange('creatorLink', e.target.value)}
                placeholder="https://www.roblox.com/users/[ID]/profile"
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-lime font-bold text-gray-900 focus:outline-none focus:border-roblox-orange"
              />
            </div>

            {/* Release Date & Time */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Release Date & Time</label>
              <input
                type="datetime-local"
                value={formData.releaseDateTime}
                onChange={(e) => handleFormChange('releaseDateTime', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-yellow font-bold text-gray-900 focus:outline-none focus:border-roblox-purple"
              />
              <p className="text-xs text-gray-600 mt-1">
                Local: {formatLocalDateTime(formData.releaseDateTime)}
              </p>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Stock Amount</label>
              <input
                type="number"
                value={typeof formData.stock === 'number' ? formData.stock : 0}
                onChange={(e) => handleFormChange('stock', parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-purple font-bold text-gray-900 focus:outline-none focus:border-roblox-pink"
              />
            </div>

            {/* Method */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Drop Method</label>
              <select
                value={formData.method}
                onChange={(e) => handleFormChange('method', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-4 border-roblox-orange font-bold text-gray-900 focus:outline-none"
              >
                <option value={UGCMethod.WebDrop}>🌐 Web Drop</option>
                <option value={UGCMethod.InGame}>🎮 In-Game</option>
                <option value={UGCMethod.Unknown}>❓ Unknown</option>
              </select>
            </div>

            {/* Limit Per User */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Limit Per User</label>
              <input
                type="number"
                value={formData.limitPerUser}
                onChange={(e) => handleFormChange('limitPerUser', parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border-4 border-blue-500 font-bold text-gray-900 focus:outline-none"
              />
            </div>

            {/* Game Link */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Game Link</label>
              <input
                type="url"
                value={formData.gameLink}
                onChange={(e) => handleFormChange('gameLink', e.target.value)}
                placeholder="https://www.roblox.com/games/..."
                className="w-full px-4 py-3 rounded-lg border-4 border-indigo-500 font-bold text-gray-900 focus:outline-none"
              />
            </div>

            {/* Item Link */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 uppercase">Item Link</label>
              <input
                type="url"
                value={formData.itemLink}
                onChange={(e) => handleFormChange('itemLink', e.target.value)}
                placeholder="https://www.roblox.com/catalog/..."
                className="w-full px-4 py-3 rounded-lg border-4 border-violet-500 font-bold text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase">How to Get It</label>
            <textarea
              value={formData.instruction}
              onChange={(e) => handleFormChange('instruction', e.target.value)}
              placeholder="Instructions for obtaining the item..."
              className="w-full px-4 py-3 rounded-lg border-4 border-roblox-pink font-bold text-gray-900 focus:outline-none focus:border-roblox-cyan h-24 resize-none"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 uppercase">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleFormChange('imageUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg border-4 border-roblox-cyan font-bold text-gray-900 focus:outline-none focus:border-roblox-pink"
            />
          </div>

          {/* Preview */}
          {formData.title && (
            <div className="p-6 bg-gray-50 rounded-xl border-4 border-dashed border-gray-300 space-y-3">
              <p className="text-sm font-bold text-gray-600 uppercase">Preview</p>
              <div className="flex items-center gap-4">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-24 h-24 object-contain rounded-lg border-2 border-gray-300"
                />
                <div>
                  <p className="font-black text-lg text-gray-900">{formData.title}</p>
                  <p className="text-sm text-gray-600">by {formData.creator}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatLocalDateTime(formData.releaseDateTime)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={handleAddSchedule}
            className="w-full gradient-button px-8 py-4 text-lg rounded-xl font-black uppercase tracking-wider blocky-shadow-hover"
          >
            ✨ Add to Schedule ✨
          </button>
        </div>

        {/* Scheduled Items */}
        {scheduledItems.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-white drop-shadow-lg">📋 Scheduled Items ({scheduledItems.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {scheduledItems.map((item) => {
                const gradient = gradients[item.id];
                const gradientStr = gradient
                  ? `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]}, ${gradient[2]}, ${gradient[3]})`
                  : 'linear-gradient(135deg, #ff006e, #00d9ff)';

                return (
                  <div
                    key={item.id}
                    className="pop-in bg-white rounded-xl overflow-hidden border-4 shadow-2xl blocky-shadow-hover flex flex-col h-full transition-all duration-300 hover:scale-105"
                    style={{
                      borderColor: gradient ? gradient[0] : '#ff006e',
                    }}
                  >
                    {/* Animated Gradient Top Bar */}
                    <div
                      className="h-3 w-full"
                      style={{
                        background: gradientStr,
                        backgroundSize: '400% 400%',
                        animation: 'random-gradient 6s ease infinite',
                      }}
                    ></div>

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Item Image */}
                      <div className="flex justify-center mb-4">
                        <div
                          className="p-4 rounded-lg border-4"
                          style={{
                            borderColor: gradient?.[0] || '#ff006e',
                            backgroundColor: (gradient?.[0] || '#ff006e') + '15',
                          }}
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-32 h-32 object-contain rounded"
                            width={128}
                            height={128}
                          />
                        </div>
                      </div>

                      {/* Item Title - Clickable Link */}
                      <Link href={item.itemLink} target="_blank" rel="noopener noreferrer">
                        <h2
                          className="text-2xl font-black mb-1 text-center hover:underline cursor-pointer transition-all"
                          style={{ color: gradient?.[0] || '#ff006e' }}
                        >
                          {item.title}
                        </h2>
                      </Link>

                      {/* Creator - With optional link */}
                      <p className="text-center text-sm font-bold text-gray-600 mb-4">
                        by{' '}
                        {item.creatorLink ? (
                          <Link
                            href={item.creatorLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: gradient?.[0] || '#ff006e' }}
                            className="hover:underline cursor-pointer"
                          >
                            {item.creator}
                          </Link>
                        ) : (
                          <span style={{ color: gradient?.[0] || '#ff006e' }}>{item.creator}</span>
                        )}
                      </p>

                      {/* Data Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* Stock */}
                        <div
                          className="p-3 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: (gradient?.[0] || '#ff006e') + '15' }}
                        >
                          <p className="text-xs font-bold text-gray-600 uppercase">📦 Stock</p>
                          <p className="font-black text-sm mt-1" style={{ color: gradient?.[0] || '#ff006e' }}>
                            {typeof item.stock === 'number' ? item.stock : 'OUT'}
                          </p>
                        </div>

                        {/* Relative Time */}
                        <div
                          className="p-3 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: (gradient?.[1] || '#00d9ff') + '15' }}
                        >
                          <p className="text-xs font-bold text-gray-600 uppercase">⏰ In</p>
                          <p className="font-black text-sm mt-1" style={{ color: gradient?.[1] || '#00d9ff' }}>
                            {formatRelativeTime(item.releaseDateTime)}
                          </p>
                        </div>

                        {/* Method */}
                        <div
                          className="p-3 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: (gradient?.[2] || '#ffbe0b') + '15' }}
                        >
                          <p className="text-xs font-bold text-gray-600 uppercase">🎯 Method</p>
                          <p className="font-black text-sm mt-1" style={{ color: gradient?.[2] || '#ffbe0b' }}>
                            {item.method === UGCMethod.WebDrop ? '🌐 Web' : item.method === UGCMethod.InGame ? '🎮 Game' : '❓'}
                          </p>
                        </div>

                        {/* Limit */}
                        <div
                          className="p-3 rounded-lg border-2 border-gray-300"
                          style={{ backgroundColor: (gradient?.[3] || '#00ff41') + '15' }}
                        >
                          <p className="text-xs font-bold text-gray-600 uppercase">🔢 Limit</p>
                          <p className="font-black text-sm mt-1" style={{ color: gradient?.[3] || '#00ff41' }}>
                            {item.limitPerUser}x
                          </p>
                        </div>
                      </div>

                      {/* Exact Date & Time */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">📅 Exact Time</p>
                        <p className="text-gray-700 text-sm font-medium">{formatLocalDateTime(item.releaseDateTime)}</p>
                      </div>

                      {/* Game Link */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">🔗 Game Link</p>
                        {item.gameLink ? (
                          <a
                            href={item.gameLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold break-all hover:underline"
                            style={{ color: gradient?.[0] || '#ff006e' }}
                          >
                            {item.gameLink}
                          </a>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center">
                            <p className="text-sm font-semibold text-gray-500">⚠️ Link Status</p>
                            <p className="text-xs text-gray-400 mt-1">Game not yet published</p>
                          </div>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <p className="text-xs font-bold text-gray-600 uppercase mb-2">📖 How to Get It</p>
                        <div className="text-gray-700 text-sm font-medium break-words whitespace-pre-wrap">
                          <ClickableInstructions text={item.instruction} color={gradient?.[0] || '#ff006e'} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-3 mt-auto">
                        {item.itemLink ? (
                          <Link href={item.itemLink} target="_blank" rel="noopener noreferrer" className="w-full">
                            <button
                              className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                              style={{
                                background: `linear-gradient(135deg, ${gradient?.[0] || '#ff006e'}, ${gradient?.[1] || '#00d9ff'})`,
                                boxShadow: `0 6px 20px ${gradient?.[0] || '#ff006e'}80`,
                              }}
                            >
                              🛍️ View Item
                            </button>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full px-4 py-3 text-gray-400 font-black rounded-lg text-sm uppercase tracking-wide bg-gray-200 cursor-not-allowed"
                          >
                            🛍️ View Item
                          </button>
                        )}

                        {item.gameLink ? (
                          <Link href={item.gameLink} target="_blank" rel="noopener noreferrer" className="w-full">
                            <button
                              className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                              style={{
                                background: `linear-gradient(135deg, ${gradient?.[2] || '#ffbe0b'}, ${gradient?.[3] || '#00ff41'})`,
                                boxShadow: `0 6px 20px ${gradient?.[2] || '#ffbe0b'}80`,
                              }}
                            >
                              🎮 Join Game
                            </button>
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full px-4 py-3 text-gray-400 font-black rounded-lg text-sm uppercase tracking-wide bg-gray-200 cursor-not-allowed"
                          >
                            🎮 Join Game
                          </button>
                        )}

                        <button
                          onClick={() => handleRemoveSchedule(item.id)}
                          className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide bg-red-600 hover:bg-red-700"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {scheduledItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-2xl pop-in">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Scheduled Items Yet</h3>
            <p className="text-gray-600 text-lg font-semibold">Create your first schedule above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
