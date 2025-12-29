'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ClickableInstructions } from '../InstructionParser';
import { ToastContainer, useToast } from '../Toast';
import { createScheduledItem, updateScheduledItem, deleteScheduledItem, getScheduledItems } from '@/lib/api';
import { useTheme } from '../components/ThemeContext'; // <--- Import Global Theme
import ThemeSwitcher from '../components/ThemeSwitcher';
import { hasAccess } from '@/lib/auth';

enum UGCMethod {
  WebDrop = 'Web Drop',
  InGame = 'In-Game',
  CodeDrop = 'Code Drop',
  Unknown = 'Unknown'
}

// Ensure this matches your API response exactly
type UGCItem = {
  id?: string | number;
  uuid?: string;
  title: string;
  item_name: string;
  creator: string;
  stock?: number | string | 'OUT OF STOCK';
  release_date_time: string;
  method: UGCMethod;
  instruction?: string;
  game_link?: string;
  item_link?: string;
  image_url?: string;
  limit_per_user: number | null;
  sold_out?: boolean; // Manual sold out confirmation by scheduler
  final_current_stock?: number; // Persisted current stock when item sold out
  final_total_stock?: number; // Persisted total stock when item sold out
  ugc_code?: string; // Code for Code Drop items
  is_abandoned?: boolean; // Abandoned status
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

// Helper: Convert a UTC Date string to "YYYY-MM-DDTHH:mm" (Local time) for inputs
const toLocalInputString = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  // Format the local time components directly (Date methods return local time by default)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper: Get current local time as "YYYY-MM-DDTHH:mm" for datetime-local inputs
const getCurrentLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function SchedulePage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [userTimezone, setUserTimezone] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Theme Context
  const { currentTheme } = useTheme();
  const isGrayscale = currentTheme.name === 'bw';

  // Internal state for "Unlimited" checkbox
  const [isUnlimitedLimit, setIsUnlimitedLimit] = useState(false);
  // Internal state for "Unknown" checkboxes
  const [isUnknownStock, setIsUnknownStock] = useState(false);
  const [isUnknownSchedule, setIsUnknownSchedule] = useState(false);
  // Filter state for released/upcoming items
  const [releaseStatusFilter, setReleaseStatusFilter] = useState<'all' | 'released' | 'upcoming'>('all');
  // Sold out confirmation checkbox
  const [isSoldOut, setIsSoldOut] = useState(false);
  // Abandoned confirmation checkbox
  const [isAbandoned, setIsAbandoned] = useState(false);
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<UGCItem>({
    title: '',
    item_name: '',
    creator: '',
    stock: 1000,
    release_date_time: getCurrentLocalDateTime(),
    method: UGCMethod.InGame,
    instruction: '',
    game_link: '',
    item_link: '',
    image_url: 'https://placehold.co/400x400?text=img+placeholder',
    limit_per_user: 1,
    ugc_code: '',
  });

  const [scheduledItems, setScheduledItems] = useState<UGCItem[]>([]); // Typed correctly
  const [gradients, setGradients] = useState<{ [key: string]: string[] }>({});

  // Load scheduled items from API
  const loadScheduledItems = useCallback(async () => {
    try {
      const items = await getScheduledItems();
      setScheduledItems(items as unknown as UGCItem[]);

      // Only generate gradients for new items, preserve existing ones
      setGradients(prevGradients => {
        const newGradients = { ...prevGradients };
        items.forEach((item: any) => {
          const key = item.uuid || item.id;
          if (!newGradients[key]) {
            newGradients[key] = shuffleThemeGradients(key);
          }
        });
        return newGradients;
      });
    } catch (error) {
      console.error('Failed to load scheduled items:', error);
      addToast('Failed to load scheduled items', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    // Check if user has editor or owner access
    if (!hasAccess('editor')) {
      router.push('/');
      return;
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(tz);
    setIsOwner(hasAccess('owner'));
    loadScheduledItems();
  }, [loadScheduledItems, router]);

  const handleAddSchedule = async () => {
    if (!formData.item_name || !formData.creator) {
      addToast('Please fill in item name and creator', 'error');
      return;
    }

    setIsLoading(true);

    // Handle Unknown schedule - use null or a far future date as marker
    // Handle Unknown stock - use -1 as marker (similar to unlimited limit)
    // FIXED: datetime-local gives format "2025-12-26T02:57" which is LOCAL time.
    // We need to convert it to UTC. new Date() correctly interprets this as local,
    // but we need to ensure it's not being double-converted elsewhere.
    // Use Sentinel Date for Unknown (9999-01-01T00:00:00Z) to satisfy NOT NULL constraint
    let utcDate: string = '9999-01-01T00:00:00Z';
    if (!isUnknownSchedule && formData.release_date_time) {
      // Parse the local time string from datetime-local input
      const localDate = new Date(formData.release_date_time);
      // Convert to ISO string (which is always UTC with 'Z' suffix)
      utcDate = localDate.toISOString();
    }
    const stockValue = isUnknownStock ? -1 : formData.stock;

    const payload = {
      ...formData,
      title: formData.item_name, // Use item_name as title
      release_date_time: utcDate, // null if unknown
      stock: stockValue, // 'unknown' string if unknown
      limit_per_user: isUnlimitedLimit ? -1 : (formData.limit_per_user || 1),
      sold_out: isSoldOut, // Manual sold out confirmation
      is_abandoned: isAbandoned, // Abandoned status
    };

    try {
      if (editingId) {
        // Update existing item
        const result = await updateScheduledItem(editingId, payload as any);

        if (result) {
          // Cast result to UGCItem to satisfy strict TypeScript checks
          const typedResult = result as unknown as UGCItem;

          setScheduledItems(items =>
            items.map(item => {
              // Compare IDs as strings to be safe
              const currentId = String(item.uuid || item.id);
              const targetId = String(editingId);
              return (currentId === targetId) ? typedResult : item;
            })
          );

          addToast('Schedule updated successfully! ✨', 'success');
          setEditingId(null);
          handleCancelEdit(); // Reset form
        } else {
          addToast('Failed to update schedule', 'error');
        }
      } else {
        // Create new item
        const result = await createScheduledItem(payload as any);

        if (result) {
          const typedResult = result as unknown as UGCItem; // Cast here
          const newId = String(typedResult.uuid || typedResult.id);

          setScheduledItems([...scheduledItems, typedResult]);

          setGradients({
            ...gradients,
            [newId]: shuffleThemeGradients(newId),
          });

          addToast('Schedule created successfully! 🎉', 'success');
          handleCancelEdit(); // Reset form
        } else {
          addToast('Failed to create schedule', 'error');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      addToast('An unexpected error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSchedule = (item: UGCItem) => {
    setEditingId(String(item.uuid || item.id || ''));

    const isUnlimited = item.limit_per_user === null || item.limit_per_user === -1;
    setIsUnlimitedLimit(isUnlimited);

    // Check if stock is unknown
    const stockIsUnknown = item.stock === 'unknown' || item.stock === 'Unknown' || item.stock === -1;
    setIsUnknownStock(stockIsUnknown);

    // Check if schedule is unknown (null, empty, or sentinel year 9999)
    const scheduleIsUnknown = !item.release_date_time || item.release_date_time.startsWith('9999');
    setIsUnknownSchedule(scheduleIsUnknown);

    // Check if item is marked as sold out
    setIsSoldOut(item.sold_out === true);

    // Check if item is abandoned
    setIsAbandoned(item.is_abandoned === true);

    setFormData({
      title: item.item_name || item.title || '',
      item_name: item.item_name || item.title || '',
      creator: item.creator || '',
      stock: stockIsUnknown ? 1000 : (typeof item.stock === 'number' ? item.stock : 1000),
      // Convert UTC Database Time -> Local Input Format
      release_date_time: scheduleIsUnknown ? getCurrentLocalDateTime() : (item.release_date_time ? toLocalInputString(item.release_date_time) : getCurrentLocalDateTime()),
      method: item.method || UGCMethod.WebDrop,
      instruction: item.instruction || '',
      game_link: item.game_link || '',
      item_link: item.item_link || '',
      image_url: item.image_url || 'https://placehold.co/400x400?text=img+placeholder',
      limit_per_user: isUnlimited ? 1 : (item.limit_per_user || 1),
      ugc_code: item.ugc_code || '',
    });
    // Open edit modal instead of scrolling
    setIsEditModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsUnlimitedLimit(false);
    setIsUnknownStock(false);
    setIsUnknownSchedule(false);
    setIsUnknownSchedule(false);
    setIsSoldOut(false);
    setIsAbandoned(false);
    setIsEditModalOpen(false);
    document.body.style.overflow = 'unset';
    setFormData({
      title: '',
      item_name: '',
      creator: '',
      stock: 1000,
      release_date_time: getCurrentLocalDateTime(),
      method: UGCMethod.WebDrop,
      instruction: '',
      game_link: '',
      item_link: '',
      image_url: 'https://placehold.co/400x400?text=img+placeholder',
      limit_per_user: 1,
      ugc_code: '',
    });
  };

  const handleRemoveSchedule = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const confirmDeleteSchedule = async () => {
    if (!itemToDelete) return;

    setIsLoading(true);
    try {
      const success = await deleteScheduledItem(itemToDelete);
      if (success) {
        setScheduledItems(items => items.filter(item => {
          const itemId = String(item.uuid || item.id);
          const compareId = String(itemToDelete);
          return itemId !== compareId;
        }));

        if (editingId === itemToDelete) {
          handleCancelEdit();
        }
        addToast('Schedule deleted successfully', 'success');
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        document.body.style.overflow = 'unset';
      } else {
        addToast('Failed to delete schedule', 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      addToast('Error deleting schedule', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
    document.body.style.overflow = 'unset';
  };

  const handleFormChange = (field: keyof UGCItem, value: any) => {
    setFormData(prev => {
      const updates: any = { [field]: value };

      // Auto-link for Code Drop
      if (field === 'method' && value === UGCMethod.CodeDrop) {
        updates.game_link = 'https://www.roblox.com/games/15108736400/';
      }

      return { ...prev, ...updates };
    });
  };

  const formatRelativeTime = (dateTimeString: string): string => {
    if (!dateTimeString) return 'No Date';
    try {
      const releaseDate = new Date(dateTimeString);
      const now = new Date();
      const diff = releaseDate.getTime() - now.getTime();

      if (isNaN(diff)) return 'Invalid Date';
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
    if (!dateTimeString) return 'No Date Set';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return 'Invalid Date'; // Check for valid date object
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
    <div className={`min-h-screen py-12 relative transition-all duration-700 ${isGrayscale ? 'bg-gray-900' : ''}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* --- THEME PALETTE SWITCHER --- */}
      <ThemeSwitcher />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="mb-12 text-center space-y-4 pop-in">
          <h1 className="text-6xl md:text-7xl font-black rainbow-text drop-shadow-2xl">
            📅 SCHEDULE DROPS
          </h1>
          <p className="text-xl md:text-2xl theme-on-bg-text font-bold drop-shadow-lg">
            Create and manage upcoming UGC releases
          </p>
          <p className="text-lg theme-on-bg-text-secondary font-semibold drop-shadow-md">
            Timezone: {userTimezone}
          </p>
          <div className="h-1 w-96 mx-auto theme-gradient-bar rounded-full glow-pink"></div>
        </div>

        <button
          onClick={() => router.push('/leaks')}
          className="mb-8 px-6 py-3 bg-white text-gray-900 font-bold rounded-lg blocky-shadow hover:scale-105 transition-all"
        >
          ← Back to Leaks
        </button>

        {/* --- MANAGE ROLES BUTTON (OWNER ONLY) --- */}
        {isOwner && (
          <button
            onClick={() => router.push('/schedule/manage-roles')}
            className="mb-8 ml-3 px-6 py-3 bg-purple-600 text-white font-bold rounded-lg blocky-shadow hover:scale-105 transition-all"
          >
            👥 Manage User Roles
          </button>
        )}

        {/* Creation Form - Always for creating new items */}
        <div ref={formRef} className="mb-12 p-8 bg-white rounded-2xl shadow-2xl blocky-shadow space-y-6">
          <h2 className="text-3xl font-black text-gray-900">➕ Create New Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Name */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Item Name</label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => handleFormChange('item_name', e.target.value)}
                placeholder="e.g., Red Valkyrie Helm"
                className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-1)' }}
              />
            </div>

            {/* Creator */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Creator Name</label>
              <input
                type="text"
                value={formData.creator}
                onChange={(e) => handleFormChange('creator', e.target.value)}
                placeholder="e.g., RobloxianCreations"
                className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-2)' }}
              />
            </div>

            {/* Release Date & Time */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Release Date & Time</label>
              <div className="flex gap-4 items-center">
                <input
                  type="datetime-local"
                  value={formData.release_date_time}
                  onChange={(e) => handleFormChange('release_date_time', e.target.value)}
                  disabled={isUnknownSchedule}
                  className={`w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card ${isUnknownSchedule ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}`}
                  style={!isUnknownSchedule ? { borderColor: 'var(--theme-gradient-3)' } : {}}
                />
                {/* Unknown Schedule Checkbox */}
                <div className="flex items-center gap-2 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="unknown-schedule-check"
                    checked={isUnknownSchedule}
                    onChange={(e) => setIsUnknownSchedule(e.target.checked)}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="unknown-schedule-check" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Unknown</label>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isUnknownSchedule ? 'Release time not yet announced' : `Equivalent UTC: ${formData.release_date_time ? new Date(formData.release_date_time).toUTCString() : 'Set a date'}`}
              </p>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Stock Amount</label>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  value={typeof formData.stock === 'number' ? formData.stock : 0}
                  onChange={(e) => handleFormChange('stock', parseInt(e.target.value))}
                  disabled={isUnknownStock}
                  className={`w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card ${isUnknownStock ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}`}
                  style={!isUnknownStock ? { borderColor: 'var(--theme-gradient-4)' } : {}}
                />
                {/* Unknown Stock Checkbox */}
                <div className="flex items-center gap-2 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="unknown-stock-check"
                    checked={isUnknownStock}
                    onChange={(e) => setIsUnknownStock(e.target.checked)}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="unknown-stock-check" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Unknown</label>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {isUnknownStock ? 'Stock quantity not yet announced' : 'Expected stock quantity when published'}
              </p>

              {/* Sold Out Confirmation */}
              <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-lg border-2 border-red-200">
                <input
                  type="checkbox"
                  id="sold-out-check"
                  checked={isSoldOut}
                  onChange={(e) => setIsSoldOut(e.target.checked)}
                  className="w-5 h-5 accent-red-600"
                />
                <label htmlFor="sold-out-check" className="text-sm font-bold text-red-700 cursor-pointer select-none">
                  🚫 Mark as SOLD OUT (skip API stock check)
                </label>
              </div>

              {/* Abandoned Status */}
              <div className="flex items-center gap-2 mt-3 p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                <input
                  type="checkbox"
                  id="abandoned-check"
                  checked={isAbandoned}
                  onChange={(e) => setIsAbandoned(e.target.checked)}
                  className="w-5 h-5 accent-gray-600"
                />
                <label htmlFor="abandoned-check" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  🏚️ Mark as ABANDONED
                </label>
              </div>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Drop Method</label>
              <select
                value={formData.method}
                onChange={(e) => handleFormChange('method', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-secondary)' }}
              >
                <option value={UGCMethod.WebDrop}>🌐 Web Drop</option>
                <option value={UGCMethod.InGame}>🎮 In-Game</option>
                <option value={UGCMethod.CodeDrop}>🗝️ Code Drop</option>
                <option value={UGCMethod.Unknown}>❓ Unknown</option>
              </select>
            </div>

            {/* Code Input (Conditional) */}
            {formData.method === UGCMethod.CodeDrop && (
              <div className="space-y-2">
                <label className="block text-sm font-bold theme-text-secondary uppercase">Code</label>
                <input
                  type="text"
                  value={formData.ugc_code || ''}
                  onChange={(e) => handleFormChange('ugc_code', e.target.value)}
                  placeholder="Enter Code..."
                  className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                  style={{ borderColor: 'var(--theme-accent)' }}
                />
              </div>
            )}

            {/* Limit Per User */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Limit Per User</label>
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  value={formData.limit_per_user || 1}
                  onChange={(e) => handleFormChange('limit_per_user', parseInt(e.target.value))}
                  disabled={isUnlimitedLimit} // Disable if checked
                  className={`w-full px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none ${isUnlimitedLimit ? 'bg-gray-100 border-gray-300 text-gray-400' : 'border-blue-500'}`}
                />
                {/* The Checkbox Container */}
                <div className="flex items-center gap-2 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="unlimited-check"
                    checked={isUnlimitedLimit}
                    onChange={(e) => setIsUnlimitedLimit(e.target.checked)}
                    className="w-5 h-5 accent-blue-600"
                  />
                  <label htmlFor="unlimited-check" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Unlimited</label>
                </div>
              </div>
            </div>

            {/* Game Link */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Game Link</label>
              <input
                type="url"
                value={formData.game_link}
                onChange={(e) => handleFormChange('game_link', e.target.value)}
                placeholder="https://www.roblox.com/games/..."
                className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-1)' }}
              />
            </div>

            {/* Item Link */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Item Link</label>
              <input
                type="url"
                value={formData.item_link}
                onChange={(e) => handleFormChange('item_link', e.target.value)}
                placeholder="https://www.roblox.com/catalog/..."
                className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-2)' }}
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="block text-sm font-bold theme-text-secondary uppercase">How to Get It</label>
            <textarea
              value={formData.instruction}
              onChange={(e) => handleFormChange('instruction', e.target.value)}
              placeholder="Instructions for obtaining the item..."
              className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none h-40 resize-y theme-bg-card"
              style={{ borderColor: 'var(--theme-gradient-3)' }}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <label className="block text-sm font-bold theme-text-secondary uppercase">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => handleFormChange('image_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
              style={{ borderColor: 'var(--theme-gradient-4)' }}
            />
          </div>

          {/* Preview */}
          {formData.item_name && (
            <div className="p-6 bg-gray-50 rounded-xl border-4 border-dashed border-gray-300 space-y-3">
              <p className="text-sm font-bold text-gray-600 uppercase">Preview</p>
              <div className="flex items-center gap-4">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-24 h-24 object-contain rounded-lg border-2 border-gray-300"
                />
                <div>
                  <p className="font-black text-lg text-gray-900">{formData.item_name}</p>
                  <p className="text-sm text-gray-600">by {formData.creator}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatLocalDateTime(formData.release_date_time)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Button - Creation only */}
          <div className="flex gap-4">
            <button
              onClick={handleAddSchedule}
              disabled={isLoading || editingId !== null}
              className="flex-1 gradient-button px-8 py-4 text-lg rounded-xl font-black uppercase tracking-wider blocky-shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? '⏳ Processing...' : '✨ Add to Schedule ✨'}
            </button>
          </div>
        </div>

        {/* Scheduled Items */}
        {scheduledItems.length > 0 && (() => {
          // Filter items based on release status
          const now = new Date();
          const filteredItems = scheduledItems.filter((item) => {
            if (releaseStatusFilter === 'all') return true;
            // Items with no release time are considered "unknown" - show in both
            if (!item.release_date_time) return true;
            const releaseTime = new Date(item.release_date_time);
            if (releaseStatusFilter === 'released') {
              return releaseTime <= now;
            } else {
              return releaseTime > now;
            }
          });

          return (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-3xl font-black theme-on-bg-text drop-shadow-lg">📋 Scheduled Items ({filteredItems.length}/{scheduledItems.length})</h2>

                {/* Release Status Filter */}
                <div className="flex items-center gap-3">
                  <span className="theme-on-bg-text font-bold text-sm">Filter:</span>
                  <select
                    value={releaseStatusFilter}
                    onChange={(e) => setReleaseStatusFilter(e.target.value as 'all' | 'released' | 'upcoming')}
                    className="px-4 py-2 rounded-lg border-4 font-bold text-gray-900 focus:outline-none theme-bg-card"
                    style={{ borderColor: 'var(--theme-secondary)' }}
                  >
                    <option value="all">📋 All Items</option>
                    <option value="upcoming">⏳ Upcoming</option>
                    <option value="released">✅ Released</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredItems.map((item, index) => {
                  // Use shuffled theme gradient colors based on item ID for variety
                  const itemId = String(item.uuid || item.id || index);
                  const shuffledColors = shuffleThemeGradients(itemId);
                  const primaryColor = shuffledColors[0];
                  const gradientStr = `linear-gradient(135deg, ${shuffledColors[0]}, ${shuffledColors[1]}, ${shuffledColors[2]}, ${shuffledColors[3]})`;

                  return (
                    <div
                      key={item.id || item.uuid}
                      className="pop-in rounded-xl overflow-hidden border-4 shadow-2xl blocky-shadow-hover flex flex-col h-full transition-all duration-300 hover:scale-105 theme-bg-card"
                      style={{
                        borderColor: primaryColor,
                      }}
                    >
                      {/* Animated Gradient Top Bar */}
                      <div
                        className="h-3 w-full"
                        style={{
                          backgroundImage: gradientStr,
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
                              borderColor: primaryColor,
                              backgroundColor: 'var(--theme-card-bg)',
                            }}
                          >
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-32 h-32 object-contain rounded"
                              width={128}
                              height={128}
                            />
                          </div>
                        </div>

                        {/* Item Title */}
                        {item.item_link ? (
                          <Link href={item.item_link} target="_blank" rel="noopener noreferrer">
                            <h2
                              className="text-2xl font-black mb-1 text-center hover:underline cursor-pointer transition-all"
                              style={{ color: primaryColor }}
                            >
                              {item.item_name}
                            </h2>
                          </Link>
                        ) : (
                          <h2
                            className="text-2xl font-black mb-1 text-center transition-all"
                            style={{ color: primaryColor }}
                          >
                            {item.item_name}
                          </h2>
                        )}

                        {/* Creator */}
                        <p className="text-center text-sm font-bold theme-text-secondary mb-4">
                          by <span style={{ color: primaryColor }}>{item.creator}</span>
                        </p>

                        {/* Data Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {/* Stock */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card"
                            style={{ borderColor: shuffledColors[0] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">📦 Stock</p>
                            <p className="font-black text-sm mt-1" style={{ color: item.sold_out ? '#888' : shuffledColors[0] }}>
                              {item.sold_out ? `0/${item.stock || '?'}` : (typeof item.stock === 'number' ? item.stock : 'OUT')}
                            </p>
                          </div>

                          {/* Relative Time */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card"
                            style={{ borderColor: shuffledColors[1] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">⏰ In</p>
                            <p className="font-black text-sm mt-1" style={{ color: shuffledColors[1] }}>
                              {formatRelativeTime(item.release_date_time)}
                            </p>
                          </div>

                          {/* Method */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card"
                            style={{ borderColor: shuffledColors[2] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">🎯 Method</p>
                            <p className="font-black text-sm mt-1" style={{ color: shuffledColors[2] }}>
                              {item.method === UGCMethod.WebDrop ? '🌐 Web' : item.method === UGCMethod.InGame ? '🎮 Game' : '❓'}
                            </p>
                          </div>

                          {/* Limit */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card"
                            style={{ borderColor: shuffledColors[3] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">🔢 Limit</p>
                            <p className="font-black text-sm mt-1" style={{ color: shuffledColors[3] }}>
                              {(item.limit_per_user === null || item.limit_per_user === -1) ? '∞' : `${item.limit_per_user}x`}
                            </p>
                          </div>
                        </div>

                        {/* Exact Date & Time */}
                        <div className="mb-6 p-4 rounded-lg border-2 theme-bg-card" style={{ borderColor: shuffledColors[0] }}>
                          <p className="text-xs font-bold theme-text-secondary uppercase mb-2">📅 Exact Time</p>
                          <p className="theme-text-primary text-sm font-medium">
                            {formatLocalDateTime(item.release_date_time)}
                          </p>
                        </div>

                        {/* Game Link */}
                        <div className="mb-6 p-4 rounded-lg border-2 theme-bg-card" style={{ borderColor: shuffledColors[1] }}>
                          <p className="text-xs font-bold theme-text-secondary uppercase mb-2">🔗 Game Link</p>
                          {item.game_link ? (
                            <a
                              href={item.game_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold break-all hover:underline"
                              style={{ color: primaryColor }}
                            >
                              {item.game_link}
                            </a>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center">
                              <p className="text-sm font-semibold theme-text-secondary">⚠️ Link Status</p>
                              <p className="text-xs theme-text-secondary mt-1">Game not yet published</p>
                            </div>
                          )}
                        </div>

                        {/* Instructions */}
                        <div className="mb-6 p-4 rounded-lg border-2 theme-bg-card" style={{ borderColor: shuffledColors[2] }}>
                          <p className="text-xs font-bold theme-text-secondary uppercase mb-2">📖 How to Get It</p>
                          <div className="theme-text-primary text-sm font-medium break-words whitespace-pre-wrap select-text cursor-text">
                            <ClickableInstructions text={item.instruction || ''} color={primaryColor} />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 mt-auto">
                          {item.item_link ? (
                            <Link href={item.item_link} target="_blank" rel="noopener noreferrer" className="w-full">
                              <button
                                className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                                style={{
                                  background: gradientStr,
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

                          {item.game_link ? (
                            <Link href={item.game_link} target="_blank" rel="noopener noreferrer" className="w-full">
                              <button
                                className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                                style={{
                                  background: gradientStr,
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

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditSchedule(item)}
                              className="flex-1 px-4 py-3 text-white font-black rounded-lg transition-all duration-300 text-sm uppercase tracking-wide bg-blue-600 hover:bg-blue-700"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleRemoveSchedule(String(item.uuid || item.id || ''))}
                              className="flex-1 px-4 py-3 text-white font-black rounded-lg transition-all duration-300 text-sm uppercase tracking-wide bg-red-600 hover:bg-red-700"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Empty State */}
        {scheduledItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-2xl pop-in">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No Scheduled Items Yet</h3>
            <p className="text-gray-600 text-lg font-semibold">Create your first schedule above!</p>
          </div>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCancelEdit}
          ></div>

          {/* Modal Content */}
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 pop-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-noob-pink via-noob-purple to-noob-cyan p-6 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-2xl font-black text-white drop-shadow-lg">✏️ Edit Schedule</h2>
              <button
                onClick={handleCancelEdit}
                className="bg-white/20 hover:bg-white/40 text-white rounded-full px-4 py-2 font-bold transition-all"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Item Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => handleFormChange('item_name', e.target.value)}
                    placeholder="e.g., Red Valkyrie Helm"
                    className="w-full px-4 py-3 rounded-lg border-4 border-noob-pink font-bold text-gray-900 focus:outline-none focus:border-noob-cyan"
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
                    className="w-full px-4 py-3 rounded-lg border-4 border-noob-cyan font-bold text-gray-900 focus:outline-none focus:border-noob-pink"
                  />
                </div>

                {/* Release Date & Time */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Release Date & Time</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="datetime-local"
                      value={formData.release_date_time}
                      onChange={(e) => handleFormChange('release_date_time', e.target.value)}
                      disabled={isUnknownSchedule}
                      className={`w-full px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none ${isUnknownSchedule ? 'bg-gray-100 border-gray-300 text-gray-400' : 'border-noob-yellow focus:border-noob-purple'}`}
                    />
                    <div className="flex items-center gap-2 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="modal-unknown-schedule"
                        checked={isUnknownSchedule}
                        onChange={(e) => setIsUnknownSchedule(e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <label htmlFor="modal-unknown-schedule" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Unknown</label>
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Stock Amount</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="number"
                      value={typeof formData.stock === 'number' ? formData.stock : 0}
                      onChange={(e) => handleFormChange('stock', parseInt(e.target.value))}
                      disabled={isUnknownStock}
                      className={`w-full px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none ${isUnknownStock ? 'bg-gray-100 border-gray-300 text-gray-400' : 'border-noob-purple focus:border-noob-pink'}`}
                    />
                    <div className="flex items-center gap-2 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="modal-unknown-stock"
                        checked={isUnknownStock}
                        onChange={(e) => setIsUnknownStock(e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <label htmlFor="modal-unknown-stock" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Unknown</label>
                    </div>
                  </div>

                  {/* Sold Out Confirmation */}
                  <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 rounded-lg border-2 border-red-200">
                    <input
                      type="checkbox"
                      id="modal-sold-out"
                      checked={isSoldOut}
                      onChange={(e) => setIsSoldOut(e.target.checked)}
                      className="w-5 h-5 accent-red-600"
                    />
                    <label htmlFor="modal-sold-out" className="text-sm font-bold text-red-700 cursor-pointer select-none">
                      🚫 Mark as SOLD OUT
                    </label>
                  </div>

                  {/* Abandoned Status */}
                  <div className="flex items-center gap-2 mt-3 p-3 bg-gray-100 rounded-lg border-2 border-gray-300">
                    <input
                      type="checkbox"
                      id="modal-abandoned"
                      checked={isAbandoned}
                      onChange={(e) => setIsAbandoned(e.target.checked)}
                      className="w-5 h-5 accent-gray-600"
                    />
                    <label htmlFor="modal-abandoned" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                      🏚️ Mark as ABANDONED
                    </label>
                  </div>
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Drop Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => handleFormChange('method', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-4 border-noob-orange font-bold text-gray-900 focus:outline-none"
                  >
                    <option value={UGCMethod.WebDrop}>🌐 Web Drop</option>
                    <option value={UGCMethod.InGame}>🎮 In-Game</option>
                    <option value={UGCMethod.CodeDrop}>🗝️ Code Drop</option>
                    <option value={UGCMethod.Unknown}>❓ Unknown</option>
                  </select>
                </div>

                {/* Code Input (Conditional) */}
                {formData.method === UGCMethod.CodeDrop && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 uppercase">Code</label>
                    <input
                      type="text"
                      value={formData.ugc_code || ''}
                      onChange={(e) => handleFormChange('ugc_code', e.target.value)}
                      placeholder="Enter Code..."
                      className="w-full px-4 py-3 rounded-lg border-4 border-noob-cyan font-bold text-gray-900 focus:outline-none"
                    />
                  </div>
                )}

                {/* Limit Per User */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Limit Per User</label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="number"
                      value={formData.limit_per_user || 1}
                      onChange={(e) => handleFormChange('limit_per_user', parseInt(e.target.value))}
                      disabled={isUnlimitedLimit}
                      className={`w-full px-4 py-3 rounded-lg border-4 font-bold text-gray-900 focus:outline-none ${isUnlimitedLimit ? 'bg-gray-100 border-gray-300 text-gray-400' : 'border-blue-500'}`}
                    />
                    <div className="flex items-center gap-2 whitespace-nowrap bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="modal-unlimited"
                        checked={isUnlimitedLimit}
                        onChange={(e) => setIsUnlimitedLimit(e.target.checked)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <label htmlFor="modal-unlimited" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Unlimited</label>
                    </div>
                  </div>
                </div>

                {/* Game Link */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Game Link</label>
                  <input
                    type="url"
                    value={formData.game_link}
                    onChange={(e) => handleFormChange('game_link', e.target.value)}
                    placeholder="https://www.roblox.com/games/..."
                    className="w-full px-4 py-3 rounded-lg border-4 border-indigo-500 font-bold text-gray-900 focus:outline-none"
                  />
                </div>

                {/* Item Link */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 uppercase">Item Link</label>
                  <input
                    type="url"
                    value={formData.item_link}
                    onChange={(e) => handleFormChange('item_link', e.target.value)}
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
                  className="w-full px-4 py-3 rounded-lg border-4 border-noob-pink font-bold text-gray-900 focus:outline-none focus:border-noob-cyan h-24 resize-none"
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 uppercase">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleFormChange('image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-lg border-4 border-noob-cyan font-bold text-gray-900 focus:outline-none focus:border-noob-pink"
                />
              </div>

              {/* Preview */}
              {formData.item_name && (
                <div className="p-6 bg-gray-50 rounded-xl border-4 border-dashed border-gray-300 space-y-3">
                  <p className="text-sm font-bold text-gray-600 uppercase">Preview</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-24 h-24 object-contain rounded-lg border-2 border-gray-300"
                    />
                    <div>
                      <p className="font-black text-lg text-gray-900">{formData.item_name}</p>
                      <p className="text-sm text-gray-600">by {formData.creator}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatLocalDateTime(formData.release_date_time)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddSchedule}
                  disabled={isLoading}
                  className="flex-1 gradient-button px-8 py-4 text-lg rounded-xl font-black uppercase tracking-wider blocky-shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gray-400 hover:bg-gray-500 text-white text-lg rounded-xl font-black uppercase tracking-wider blocky-shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div >
      )
      }

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={cancelDelete}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 pop-in overflow-hidden">
            <div className="bg-red-600 p-6 text-white text-center">
              <div className="text-5xl mb-2">🗑️</div>
              <h2 className="text-2xl font-black uppercase">Confirm Delete</h2>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="text-gray-700 font-bold text-lg">
                Are you sure you want to delete this schedule?
                <br />
                <span className="text-sm text-gray-500 font-normal">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg uppercase tracking-wide transition-all">
                  Cancel
                </button>
                <button onClick={confirmDeleteSchedule} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg uppercase tracking-wide transition-all shadow-lg shadow-red-200">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}