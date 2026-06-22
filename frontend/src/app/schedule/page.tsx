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
import TranslateWidget from '../components/TranslateWidget';
import CloudinaryUpload from '../components/CloudinaryUpload';
import { hasAccess } from '@/lib/auth';

enum UGCMethod {
  WebDrop = 'Web Drop',
  Quest = 'Quest',
  Launcher = 'Launcher',
  JoinAndClaim = 'J&C',
  CodeDrop = 'Code Drop',
  TwitchPoints = 'Twitch Points',
  InGame = 'In-Game', // Legacy
  Unknown = 'Unknown'
}

const METHOD_OPTIONS = [
  { value: UGCMethod.WebDrop, label: '🌐 Web Drop' },
  { value: UGCMethod.Quest, label: '🏰 Quest' },
  { value: UGCMethod.Launcher, label: '🚀 Launcher' },
  { value: UGCMethod.JoinAndClaim, label: '🤝 J&C' },
  { value: UGCMethod.CodeDrop, label: '🗝️ Code Drop' },
  { value: UGCMethod.TwitchPoints, label: '🟪 Twitch Points' },
  { value: UGCMethod.Unknown, label: '❓ Unknown' },
];

// Ensure this matches your API response exactly
type UGCItem = {
  id?: string | number;
  uuid?: string;
  title: string;
  item_name: string;
  creator: string;
  stock?: number | string | 'OUT OF STOCK';
  release_date_time: string;
  method: UGCMethod[];
  instruction?: string;
  game_link?: string;
  game_links?: string[];
  item_link?: string;
  image_url?: string;
  screenshots?: string[];
  limit_per_user: number | null;
  sold_out?: boolean; // Manual sold out confirmation by scheduler
  final_current_stock?: number; // Persisted current stock when item sold out
  final_total_stock?: number; // Persisted total stock when item sold out
  ugc_code?: string; // Code for Code Drop items
  is_abandoned?: boolean; // Abandoned status
  is_paid?: boolean; // Paid item status (not free)
  is_regular?: boolean; // Regular item status (unlimited/event)
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

  // Filtering states (matching /leaks page)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<UGCMethod | 'All'>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'stock' | 'limit' | 'upcoming'>('upcoming');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'active' | 'upcoming' | 'paid' | 'regular' | 'abandoned'>('upcoming');

  // Filter state for released/upcoming items
  const [releaseStatusFilter, setReleaseStatusFilter] = useState<'all' | 'released' | 'upcoming'>('all');
  // Sold out confirmation checkbox
  const [isSoldOut, setIsSoldOut] = useState(false);
  // Abandoned confirmation checkbox
  const [isAbandoned, setIsAbandoned] = useState(false);
  // Paid item checkbox
  const [isPaid, setIsPaid] = useState(false);
  // Regular item checkbox
  const [isRegular, setIsRegular] = useState(false);
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  // Image viewer modal state
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);

  const [formData, setFormData] = useState<UGCItem>({
    title: '',
    item_name: '',
    creator: '',
    stock: 1000,
    release_date_time: getCurrentLocalDateTime(),
    method: [UGCMethod.Unknown],
    instruction: '',
    game_link: '',
    game_links: [],
    item_link: '',
    image_url: 'https://placehold.co/400x400?text=img+placeholder',
    screenshots: [],
    limit_per_user: 1,
    ugc_code: '',
  });

  const [scheduledItems, setScheduledItems] = useState<UGCItem[]>([]); // Typed correctly
  const [gradients, setGradients] = useState<{ [key: string]: string[] }>({});

  // Load scheduled items from API
  const loadScheduledItems = useCallback(async () => {
    try {
      const items = await getScheduledItems();
      
      // Force UTC timezone by adding Z if missing (Database may strip 'Z' from timestamp)
      const sanitizedItems = items.map((item: any) => {
        let dateStr = item.release_date_time_utc || item.release_date_time;
        if (dateStr && typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
          dateStr = dateStr.replace(' ', 'T') + 'Z';
        }
        return { ...item, release_date_time: dateStr };
      });

      setScheduledItems(sanitizedItems as unknown as UGCItem[]);

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
      is_paid: isPaid, // Paid item status
      is_regular: isRegular, // Regular item status
      game_links: formData.game_links || [],
      game_link: (formData.game_links && formData.game_links.length > 0) ? formData.game_links[0] : formData.game_link,
      screenshots: formData.screenshots || [],
    };

    try {
      if (editingId) {
        // Update existing item
        const result = await updateScheduledItem(editingId, payload as any);

        if (result) {
          // Cast result to UGCItem and force UTC timezone
          let dateStr = (result as any).release_date_time_utc || (result as any).release_date_time;
          if (dateStr && typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
            dateStr = dateStr.replace(' ', 'T') + 'Z';
          }
          const typedResult = { ...result, release_date_time: dateStr } as unknown as UGCItem;

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
          // Cast result to UGCItem and force UTC timezone
          let dateStr = (result as any).release_date_time_utc || (result as any).release_date_time;
          if (dateStr && typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
            dateStr = dateStr.replace(' ', 'T') + 'Z';
          }
          const typedResult = { ...result, release_date_time: dateStr } as unknown as UGCItem;
          
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

    // Check if item is paid
    setIsPaid(item.is_paid === true);

    // Check if item is regular
    setIsRegular(item.is_regular === true);

    setFormData({
      title: item.item_name || item.title || '',
      item_name: item.item_name || item.title || '',
      creator: item.creator || '',
      stock: stockIsUnknown ? 1000 : (typeof item.stock === 'number' ? item.stock : 1000),
      // Convert UTC Database Time -> Local Input Format
      release_date_time: scheduleIsUnknown ? getCurrentLocalDateTime() : (item.release_date_time ? toLocalInputString(item.release_date_time) : getCurrentLocalDateTime()),
      method: Array.isArray(item.method) ? item.method : (item.method ? [item.method as UGCMethod] : [UGCMethod.Unknown]),
      instruction: item.instruction || '',
      game_link: item.game_link || '',
      game_links: Array.isArray(item.game_links) && item.game_links.length > 0 ? item.game_links : (item.game_link ? [item.game_link] : []),
      item_link: item.item_link || '',
      image_url: item.image_url || 'https://placehold.co/400x400?text=img+placeholder',
      screenshots: Array.isArray(item.screenshots) ? item.screenshots : [],
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
    setIsPaid(false);
    setIsRegular(false);
    setIsEditModalOpen(false);
    document.body.style.overflow = 'unset';
    setFormData({
      title: '',
      item_name: '',
      creator: '',
      stock: 1000,
      release_date_time: getCurrentLocalDateTime(),
      method: [UGCMethod.Unknown],
      instruction: '',
      game_link: '',
      game_links: [],
      item_link: '',
      image_url: 'https://placehold.co/400x400?text=img+placeholder',
      screenshots: [],
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

  const toggleMethod = (methodVal: UGCMethod) => {
    setFormData(prev => {
      const currentMethods = Array.isArray(prev.method) ? prev.method : [prev.method || UGCMethod.Unknown];
      let newMethods: UGCMethod[];
      
      if (currentMethods.includes(methodVal)) {
        newMethods = currentMethods.filter(m => m !== methodVal);
        if (newMethods.length === 0) newMethods = [UGCMethod.Unknown];
      } else {
        newMethods = currentMethods.filter(m => m !== UGCMethod.Unknown);
        newMethods.push(methodVal);
      }
      
      const updates: any = { method: newMethods };
      if (methodVal === UGCMethod.CodeDrop && !currentMethods.includes(UGCMethod.CodeDrop)) {
        updates.game_link = 'https://www.roblox.com/games/15108736400/';
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleFormChange = (field: keyof UGCItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Game Links Helpers ---
  const addGameLink = () => {
    setFormData(prev => ({
      ...prev,
      game_links: [...(prev.game_links || []), ''],
    }));
  };

  const removeGameLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      game_links: (prev.game_links || []).filter((_, i) => i !== index),
    }));
  };

  const updateGameLink = (index: number, value: string) => {
    setFormData(prev => {
      const links = [...(prev.game_links || [])];
      links[index] = value;
      return { ...prev, game_links: links, game_link: links[0] || '' };
    });
  };

  // --- Screenshot Helpers ---
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const uploadScreenshotToCloudinary = async (file: File): Promise<string | null> => {
    if (!cloudName || !uploadPreset) return null;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    fd.append('folder', 'ugc-leaks/screenshots');
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      return data.secure_url || null;
    } catch (err) {
      console.error('Screenshot upload failed:', err);
      return null;
    }
  };

  const handleScreenshotFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    addToast(`Uploading ${fileArr.length} screenshot(s)...`, 'info');
    const urls: string[] = [];
    for (const file of fileArr) {
      if (!file.type.startsWith('image/')) continue;
      const url = await uploadScreenshotToCloudinary(file);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      setFormData(prev => ({
        ...prev,
        screenshots: [...(prev.screenshots || []), ...urls],
      }));
      addToast(`${urls.length} screenshot(s) uploaded! 📸`, 'success');
    } else {
      addToast('Screenshot upload failed', 'error');
    }
  };

  const handleScreenshotPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleScreenshotFiles(imageFiles);
    }
  };

  const removeScreenshot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      screenshots: (prev.screenshots || []).filter((_, i) => i !== index),
    }));
  };

  const openImageViewer = (url: string) => {
    setViewerImage(url);
    setViewerZoom(1);
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setViewerImage(null);
    setViewerZoom(1);
    document.body.style.overflow = 'unset';
  };

  // Live countdown tick — forces re-render every second so timers stay accurate
  const [, setCountdownTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCountdownTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

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

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      return parts.join(' ');
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

      {/* --- THEME PALETTE SWITCHER & TRANSLATE --- */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex gap-2 sm:gap-4 scale-90 sm:scale-100 origin-top-right">
        <TranslateWidget inline={true} />
        <ThemeSwitcher inline={true} />
      </div>

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
          className="mb-8 px-6 py-3 theme-bg-card theme-text-primary font-bold rounded-lg blocky-shadow hover:scale-105 transition-all"
          style={{ border: '2px solid var(--theme-secondary)' }}
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
        <div ref={formRef} className="mb-12 p-8 theme-bg-card rounded-2xl shadow-2xl blocky-shadow space-y-6" style={{ border: '2px solid var(--theme-primary)' }}>
          <h2 className="text-3xl font-black theme-text-primary">➕ Create New Schedule</h2>

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
                  className={`w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card ${isUnknownSchedule ? 'opacity-50 border-gray-500 theme-text-secondary' : ''}`}
                  style={!isUnknownSchedule ? { borderColor: 'var(--theme-gradient-3)' } : {}}
                />
                {/* Unknown Schedule Checkbox */}
                <div className="flex items-center gap-2 whitespace-nowrap p-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-3)' }}>
                  <input
                    type="checkbox"
                    id="unknown-schedule-check"
                    checked={isUnknownSchedule}
                    onChange={(e) => setIsUnknownSchedule(e.target.checked)}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="unknown-schedule-check" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                </div>
              </div>
              <p className="text-xs theme-text-secondary mt-1">
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
                  className={`w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card ${isUnknownStock ? 'opacity-50 border-gray-500 theme-text-secondary' : ''}`}
                  style={!isUnknownStock ? { borderColor: 'var(--theme-gradient-4)' } : {}}
                />
                {/* Unknown Stock Checkbox */}
                <div className="flex items-center gap-2 whitespace-nowrap p-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                  <input
                    type="checkbox"
                    id="unknown-stock-check"
                    checked={isUnknownStock}
                    onChange={(e) => setIsUnknownStock(e.target.checked)}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="unknown-stock-check" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                </div>
              </div>
              <p className="text-xs theme-text-secondary mt-1">
                {isUnknownStock ? 'Stock quantity not yet announced' : 'Expected stock quantity when published'}
              </p>

              {/* Sold Out Confirmation */}
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2 theme-bg-card" style={{ borderColor: '#ef4444' }}>
                <input
                  type="checkbox"
                  id="sold-out-check"
                  checked={isSoldOut}
                  onChange={(e) => setIsSoldOut(e.target.checked)}
                  className="w-5 h-5 accent-red-600"
                />
                <label htmlFor="sold-out-check" className="text-sm font-bold theme-text-primary cursor-pointer select-none" style={{ color: '#ef4444' }}>
                  🚫 Mark as SOLD OUT (skip API stock check)
                </label>
              </div>

              {/* Abandoned Status */}
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-secondary)' }}>
                <input
                  type="checkbox"
                  id="abandoned-check"
                  checked={isAbandoned}
                  onChange={(e) => setIsAbandoned(e.target.checked)}
                  className="w-5 h-5 accent-gray-600"
                />
                <label htmlFor="abandoned-check" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">
                  🏚️ Mark as ABANDONED
                </label>
              </div>

              {/* Paid Item Status */}
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2" style={{ borderColor: 'var(--theme-gradient-4)', background: 'var(--theme-card-bg)' }}>
                <input
                  type="checkbox"
                  id="paid-check"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-5 h-5 accent-yellow-600"
                />
                <label htmlFor="paid-check" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">
                  💰 Mark as PAID ITEM (not free)
                </label>
              </div>

              {/* Regular Item Status */}
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2" style={{ borderColor: 'var(--theme-gradient-4)', background: 'var(--theme-card-bg)' }}>
                <input
                  type="checkbox"
                  id="regular-check"
                  checked={isRegular}
                  onChange={(e) => setIsRegular(e.target.checked)}
                  className="w-5 h-5 accent-purple-600"
                />
                <label htmlFor="regular-check" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">
                  ♾️ Mark as REGULAR (non-limited)
                </label>
              </div>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <label className="block text-sm font-bold theme-text-secondary uppercase">Drop Methods</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 p-4 rounded-lg border-4 theme-bg-card" style={{ borderColor: 'var(--theme-secondary)' }}>
                {METHOD_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.method) && formData.method.includes(opt.value)}
                      onChange={() => toggleMethod(opt.value)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm font-bold theme-text-primary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Code Input (Conditional) */}
            {Array.isArray(formData.method) && formData.method.includes(UGCMethod.CodeDrop) && (
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

            {/* Game Links (Multiple) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold theme-text-secondary uppercase">🎮 Game Links</label>
                <button
                  type="button"
                  onClick={addGameLink}
                  className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'var(--theme-gradient-1)', color: 'white' }}
                >
                  + Add Link
                </button>
              </div>
              {(formData.game_links || []).length === 0 && (
                <p className="text-xs theme-text-secondary italic">No game links added yet. Click &quot;+ Add Link&quot; to add one.</p>
              )}
              {(formData.game_links || []).map((link, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs font-bold theme-text-secondary w-6 text-center">{idx + 1}.</span>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateGameLink(idx, e.target.value)}
                    placeholder="https://www.roblox.com/games/..."
                    className="flex-1 px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                    style={{ borderColor: 'var(--theme-gradient-1)' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeGameLink(idx)}
                    className="text-red-500 hover:text-red-700 font-bold text-lg px-2 transition-all hover:scale-110"
                  >
                    ✕
                  </button>
                </div>
              ))}
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

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-bold theme-text-secondary uppercase">📷 Item Image</label>
            <CloudinaryUpload
              onImageChange={(url) => handleFormChange('image_url', url)}
              currentImageUrl={formData.image_url}
            />
          </div>

          {/* Screenshots Upload */}
          <div className="space-y-3">
            <label className="block text-sm font-bold theme-text-secondary uppercase">🖼️ Screenshots</label>
            <div
              className="p-6 rounded-xl border-4 border-dashed theme-bg-card transition-all cursor-pointer hover:opacity-80 text-center"
              style={{ borderColor: 'var(--theme-gradient-4)' }}
              onPaste={handleScreenshotPaste}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length > 0) handleScreenshotFiles(e.dataTransfer.files); }}
              tabIndex={0}
            >
              <p className="theme-text-secondary font-bold text-sm">📋 Paste from clipboard (Ctrl+V) or drag & drop images here</p>
              <p className="theme-text-secondary text-xs mt-1 opacity-75">Supports PNG, JPG, GIF, WebP</p>
              <label className="mt-3 inline-block px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all hover:scale-105 text-white"
                style={{ background: 'linear-gradient(135deg, var(--theme-gradient-3), var(--theme-gradient-4))' }}
              >
                📁 Browse Files
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) handleScreenshotFiles(e.target.files); e.target.value = ''; }}
                />
              </label>
            </div>
            {/* Screenshot Thumbnails */}
            {(formData.screenshots || []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(formData.screenshots || []).map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                    <img
                      src={url}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-auto object-contain cursor-pointer transition-all hover:scale-105"
                      onClick={() => openImageViewer(url)}
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(idx)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to preview
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {formData.item_name && (
            <div className="p-6 theme-bg-card rounded-xl border-4 border-dashed space-y-3" style={{ borderColor: 'var(--theme-secondary)' }}>
              <p className="text-sm font-bold theme-text-secondary uppercase">Preview</p>
              <div className="flex items-center gap-4">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-24 h-24 object-contain rounded-lg border-2" style={{ borderColor: 'var(--theme-secondary)' }}
                />
                <div>
                  <p className="font-black text-lg theme-text-primary">{formData.item_name}</p>
                  <p className="text-sm theme-text-secondary">by {formData.creator}</p>
                  <p className="text-xs theme-text-secondary mt-2">{formatLocalDateTime(formData.release_date_time)}</p>
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
          // Filter items with all criteria
          const now = new Date();
          const filteredItems = scheduledItems
            .filter((item) => {
              // Filter by View Mode
              const itemIsAbandoned = item.is_abandoned || false;
              const itemIsPaid = item.is_paid || false;
              const itemIsRegular = item.is_regular || false;
              const releaseTime = item.release_date_time && !item.release_date_time.startsWith('9999')
                ? new Date(item.release_date_time)
                : null;
              const isReleased = releaseTime ? releaseTime <= now : false;
              const isUpcoming = releaseTime ? releaseTime > now : true; // Unknown dates count as upcoming

              // View mode filtering
              if (viewMode === 'abandoned' && !itemIsAbandoned) return false;
              if (viewMode === 'paid' && (!itemIsPaid || itemIsAbandoned)) return false;
              if (viewMode === 'regular' && (!itemIsRegular || itemIsAbandoned)) return false;
              if (viewMode === 'active' && (itemIsAbandoned || itemIsPaid || itemIsRegular || !isReleased)) return false;
              if (viewMode === 'upcoming' && (itemIsAbandoned || itemIsPaid || itemIsRegular || !isUpcoming)) return false;

              // Search filter
              const searchLower = searchTerm.toLowerCase();
              const matchesSearch = searchTerm === '' ||
                (item.item_name || item.title || '').toLowerCase().includes(searchLower) ||
                (item.creator || '').toLowerCase().includes(searchLower);

              // Method filter - also match null/undefined/empty methods when filtering for 'Unknown'
              const itemMethods = Array.isArray(item.method) ? item.method : [item.method];
              const matchesMethod = filterMethod === 'All' ||
                itemMethods.includes(filterMethod) ||
                (filterMethod === UGCMethod.Unknown && (!item.method || itemMethods.length === 0 || itemMethods.includes(UGCMethod.Unknown)));

              // Release status filter (only applies within current view mode)
              let matchesReleaseStatus = true;
              if (releaseStatusFilter !== 'all' && item.release_date_time) {
                // Ignore items with unknown release (sentinel date)
                if (!item.release_date_time.startsWith('9999')) {
                  if (releaseStatusFilter === 'released') {
                    matchesReleaseStatus = isReleased;
                  } else if (releaseStatusFilter === 'upcoming') {
                    matchesReleaseStatus = isUpcoming;
                  }
                }
              }

              return matchesSearch && matchesMethod && matchesReleaseStatus;
            })
            .sort((a, b) => {
              let result = 0;
              const nowTime = now.getTime();

              if (sortBy === 'upcoming') {
                const timeA = a.release_date_time?.startsWith('9999') ? Infinity : new Date(a.release_date_time || 0).getTime();
                const timeB = b.release_date_time?.startsWith('9999') ? Infinity : new Date(b.release_date_time || 0).getTime();
                const diffA = timeA - nowTime;
                const diffB = timeB - nowTime;

                if (diffA > 0 && diffB > 0) {
                  result = diffA - diffB;
                } else if (diffA > 0) {
                  result = -1;
                } else if (diffB > 0) {
                  result = 1;
                } else {
                  result = diffB - diffA;
                }
              } else if (sortBy === 'recent') {
                const timeA = a.release_date_time?.startsWith('9999') ? 0 : new Date(a.release_date_time || 0).getTime();
                const timeB = b.release_date_time?.startsWith('9999') ? 0 : new Date(b.release_date_time || 0).getTime();
                result = timeB - timeA;
              } else if (sortBy === 'stock') {
                const stockA = typeof a.stock === 'number' ? a.stock : -1;
                const stockB = typeof b.stock === 'number' ? b.stock : -1;
                result = stockB - stockA;
              } else if (sortBy === 'limit') {
                const limitA = a.limit_per_user ?? -1;
                const limitB = b.limit_per_user ?? -1;
                result = limitB - limitA;
              }

              return sortDirection === 'desc' ? -result : result;
            });

          return (
            <div className="space-y-6">
              {/* View Mode Tabs */}
              <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
                <button
                  onClick={() => setViewMode('upcoming')}
                  className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'upcoming'
                    ? 'text-white shadow-lg scale-105 ring-2 ring-white'
                    : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
                    }`}
                  style={viewMode === 'upcoming' ? { background: 'linear-gradient(to right, var(--theme-gradient-3), var(--theme-gradient-4))' } : {}}
                >
                  ⏳ Upcoming ({scheduledItems.filter(i => {
                    if (i.is_abandoned || i.is_paid) return false;
                    if (!i.release_date_time || i.release_date_time.startsWith('9999')) return true;
                    return new Date(i.release_date_time) > new Date();
                  }).length})
                </button>
                <button
                  onClick={() => setViewMode('active')}
                  className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'active'
                    ? 'text-white shadow-lg scale-105 ring-2 ring-white'
                    : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
                    }`}
                  style={viewMode === 'active' ? { background: 'linear-gradient(to right, var(--theme-gradient-1), var(--theme-gradient-2))' } : {}}
                >
                  🚀 Active ({scheduledItems.filter(i => {
                    if (i.is_abandoned || i.is_paid) return false;
                    if (!i.release_date_time || i.release_date_time.startsWith('9999')) return false;
                    return new Date(i.release_date_time) <= new Date();
                  }).length})
                </button>
                <button
                  onClick={() => setViewMode('paid')}
                  className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'paid'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105 ring-2 ring-white'
                    : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
                    }`}
                >
                  💰 Paid ({scheduledItems.filter(i => i.is_paid && !i.is_abandoned).length})
                </button>
                <button
                  onClick={() => setViewMode('regular')}
                  className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'regular'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-105 ring-2 ring-white'
                    : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
                    }`}
                >
                  ♾️ Regular ({scheduledItems.filter(i => i.is_regular && !i.is_abandoned).length})
                </button>
                <button
                  onClick={() => setViewMode('abandoned')}
                  className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'abandoned'
                    ? 'bg-gradient-to-r from-gray-500 to-gray-700 text-white shadow-lg scale-105 ring-2 ring-white'
                    : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
                    }`}
                >
                  🏚️ Abandoned ({scheduledItems.filter(i => i.is_abandoned).length})
                </button>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 items-end">
                {/* Search */}
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="theme-on-bg-text font-bold uppercase text-sm">🔍 Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Item name, creator..."
                    className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                    style={{ borderColor: 'var(--theme-gradient-2)' }}
                  />
                </div>

                {/* Method Filter */}
                <div className="flex flex-col gap-2">
                  <label className="theme-on-bg-text font-bold uppercase text-sm">🎯 Method</label>
                  <select
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value as UGCMethod | 'All')}
                    className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                    style={{ borderColor: 'var(--theme-gradient-3)' }}
                  >
                    <option value="All">All Methods</option>
                    {METHOD_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Release Status Filter */}
                <div className="flex flex-col gap-2">
                  <label className="theme-on-bg-text font-bold uppercase text-sm">📅 Status</label>
                  <select
                    value={releaseStatusFilter}
                    onChange={(e) => setReleaseStatusFilter(e.target.value as 'all' | 'released' | 'upcoming')}
                    className="px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                    style={{ borderColor: 'var(--theme-gradient-3)' }}
                  >
                    <option value="all">📋 All</option>
                    <option value="upcoming">⏳ Upcoming</option>
                    <option value="released">✅ Released</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="theme-on-bg-text font-bold uppercase text-sm">📊 Sort</label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'recent' | 'stock' | 'limit' | 'upcoming')}
                      className="px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
                      style={{ borderColor: 'var(--theme-gradient-4)' }}
                    >
                      <option value="upcoming">🚀 Next Up</option>
                      <option value="recent">⏱️ Recent</option>
                      <option value="stock">📦 Stock</option>
                      <option value="limit">🔢 Limit</option>
                    </select>
                    <button
                      onClick={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                      className="px-4 py-3 rounded-lg border-4 theme-bg-card font-bold theme-text-primary hover:opacity-80 transition-all"
                      style={{ borderColor: 'var(--theme-gradient-3)' }}
                      title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    >
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <h2 className="text-2xl font-black theme-on-bg-text drop-shadow-lg">
                📋 Showing {filteredItems.length} of {scheduledItems.length} items
              </h2>
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
                              className="text-2xl font-black mb-1 text-center hover:underline cursor-pointer transition-all break-words overflow-hidden"
                              style={{ color: primaryColor }}
                            >
                              {item.item_name}
                            </h2>
                          </Link>
                        ) : (
                          <h2
                            className="text-2xl font-black mb-1 text-center transition-all break-words overflow-hidden"
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
                            <p className="font-black text-sm mt-1 truncate" style={{ color: item.sold_out ? 'var(--theme-text-secondary)' : shuffledColors[0] }}>
                              {item.sold_out ? `0/${item.stock || '?'}` : (typeof item.stock === 'number' ? item.stock : 'OUT')}
                            </p>
                          </div>

                          {/* Relative Time */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card"
                            style={{ borderColor: shuffledColors[1] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">⏰ In</p>
                            <p className="font-black text-xs mt-1 leading-snug" style={{ color: shuffledColors[1] }}>
                              {formatRelativeTime(item.release_date_time)}
                            </p>
                          </div>

                          {/* Method */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card flex flex-col justify-center"
                            style={{ borderColor: shuffledColors[2] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">🎯 Method</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(Array.isArray(item.method) ? item.method : [item.method || UGCMethod.Unknown]).map((m, idx) => {
                                let shortName = '❓';
                                if (m === UGCMethod.WebDrop) shortName = '🌐 Web';
                                else if (m === UGCMethod.InGame) shortName = '🎮 Game';
                                else if (m === UGCMethod.CodeDrop) shortName = '🗝️ Code';
                                else if (m === UGCMethod.Quest) shortName = '🏰 Quest';
                                else if (m === UGCMethod.Launcher) shortName = '🚀 Launch';
                                else if (m === UGCMethod.JoinAndClaim) shortName = '🤝 J&C';
                                else if (m === UGCMethod.TwitchPoints) shortName = '🟪 Twitch';
                                else shortName = `❓ ${m}`;

                                return (
                                  <span key={idx} className="font-black text-xs whitespace-nowrap" style={{ color: shuffledColors[2] }}>
                                    {shortName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Limit */}
                          <div
                            className="p-3 rounded-lg border-2 theme-bg-card"
                            style={{ borderColor: shuffledColors[3] }}
                          >
                            <p className="text-xs font-bold theme-text-secondary uppercase">🔢 Limit</p>
                            <p className="font-black text-sm mt-1 truncate" style={{ color: shuffledColors[3] }}>
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

                        {/* Game Links */}
                        <div className="mb-6 p-4 rounded-lg border-2 theme-bg-card" style={{ borderColor: shuffledColors[1] }}>
                          <p className="text-xs font-bold theme-text-secondary uppercase mb-2">🔗 Game Links</p>
                          {(() => {
                            const links = Array.isArray(item.game_links) && item.game_links.length > 0
                              ? item.game_links
                              : (item.game_link ? [item.game_link] : []);
                            if (links.length === 0) {
                              return (
                                <div className="border-2 border-dashed rounded p-3 text-center" style={{ borderColor: 'var(--theme-text-secondary)' }}>
                                  <p className="text-sm font-semibold theme-text-secondary">⚠️ Link Status</p>
                                  <p className="text-xs theme-text-secondary mt-1">Game not yet published</p>
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-1.5">
                                {links.filter(l => l && l.length > 0).map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold break-all hover:underline flex items-center gap-1.5 overflow-hidden"
                                    style={{ color: primaryColor }}
                                  >
                                    <span className="text-xs theme-text-secondary flex-shrink-0">{idx + 1}.</span>
                                    <span className="truncate">{link}</span>
                                  </a>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Screenshots */}
                        {Array.isArray(item.screenshots) && item.screenshots.length > 0 && (
                          <div className="mb-6 p-4 rounded-lg border-2 theme-bg-card" style={{ borderColor: shuffledColors[3] }}>
                            <p className="text-xs font-bold theme-text-secondary uppercase mb-2">🖼️ Screenshots ({item.screenshots.length})</p>
                            <div className="grid grid-cols-2 gap-2">
                              {item.screenshots.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Screenshot ${idx + 1}`}
                                  className="w-full h-auto object-contain rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg border"
                                  style={{ borderColor: shuffledColors[3] }}
                                  onClick={() => openImageViewer(url)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

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
                              className="w-full px-4 py-3 theme-text-secondary font-black rounded-lg text-sm uppercase tracking-wide theme-bg-card cursor-not-allowed opacity-50 border-2"
                              style={{ borderColor: 'var(--theme-secondary)' }}
                            >
                              🛍️ View Item
                            </button>
                          )}

                          {/* Multi Join Game Buttons */}
                          {(() => {
                            const links = Array.isArray(item.game_links) && item.game_links.length > 0
                              ? item.game_links.filter(l => l && l.length > 0)
                              : (item.game_link ? [item.game_link] : []);
                            if (links.length === 0) {
                              return (
                                <button
                                  disabled
                                  className="w-full px-4 py-3 theme-text-secondary font-black rounded-lg text-sm uppercase tracking-wide theme-bg-card cursor-not-allowed opacity-50 border-2"
                                  style={{ borderColor: 'var(--theme-secondary)' }}
                                >
                                  🎮 Join Game
                                </button>
                              );
                            }
                            if (links.length === 1) {
                              return (
                                <Link href={links[0]} target="_blank" rel="noopener noreferrer" className="w-full">
                                  <button
                                    className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                                    style={{ background: gradientStr }}
                                  >
                                    🎮 Join Game
                                  </button>
                                </Link>
                              );
                            }
                            return links.map((link, idx) => (
                              <Link key={idx} href={link} target="_blank" rel="noopener noreferrer" className="w-full">
                                <button
                                  className="w-full px-4 py-3 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 text-sm uppercase tracking-wide"
                                  style={{ background: gradientStr }}
                                >
                                  🎮 Join Game {idx + 1}
                                </button>
                              </Link>
                            ));
                          })()}

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
          <div className="text-center py-12 theme-bg-card rounded-2xl shadow-2xl pop-in" style={{ border: '2px solid var(--theme-primary)' }}>
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-black theme-text-primary mb-2">No Scheduled Items Yet</h3>
            <p className="theme-text-secondary text-lg font-semibold">Create your first schedule above!</p>
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
          <div className="theme-bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative z-10 pop-in" style={{ border: '2px solid var(--theme-primary)' }}>
            {/* Modal Header */}
            <div className="sticky top-0 p-6 rounded-t-3xl flex items-center justify-between" style={{ background: 'linear-gradient(to right, var(--theme-gradient-1), var(--theme-gradient-2), var(--theme-gradient-3))' }}>
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
                  <label className="block text-sm font-bold theme-text-secondary uppercase">Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => handleFormChange('item_name', e.target.value)}
                    placeholder="e.g., Red Valkyrie Helm"
                    className="w-full px-4 py-3 rounded-lg border-4 border-noob-pink font-bold theme-text-primary theme-bg-card focus:outline-none focus:border-noob-cyan"
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
                    className="w-full px-4 py-3 rounded-lg border-4 border-noob-cyan font-bold theme-text-primary theme-bg-card focus:outline-none focus:border-noob-pink"
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
                      className={`w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card ${isUnknownSchedule ? 'opacity-50 theme-text-secondary' : ''}`}
                      style={!isUnknownSchedule ? { borderColor: 'var(--theme-gradient-3)' } : { borderColor: 'var(--theme-text-secondary)' }}
                    />
                    <div className="flex items-center gap-2 whitespace-nowrap p-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-3)' }}>
                      <input
                        type="checkbox"
                        id="modal-unknown-schedule"
                        checked={isUnknownSchedule}
                        onChange={(e) => setIsUnknownSchedule(e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <label htmlFor="modal-unknown-schedule" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                    </div>
                  </div>
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
                      className={`w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card ${isUnknownStock ? 'opacity-50 theme-text-secondary' : ''}`}
                      style={!isUnknownStock ? { borderColor: 'var(--theme-gradient-4)' } : { borderColor: 'var(--theme-text-secondary)' }}
                    />
                    <div className="flex items-center gap-2 whitespace-nowrap p-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                      <input
                        type="checkbox"
                        id="modal-unknown-stock"
                        checked={isUnknownStock}
                        onChange={(e) => setIsUnknownStock(e.target.checked)}
                        className="w-5 h-5 accent-orange-600"
                      />
                      <label htmlFor="modal-unknown-stock" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                    </div>
                  </div>

                  {/* Sold Out Confirmation */}
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2 theme-bg-card" style={{ borderColor: '#ef4444' }}>
                    <input
                      type="checkbox"
                      id="modal-sold-out"
                      checked={isSoldOut}
                      onChange={(e) => setIsSoldOut(e.target.checked)}
                      className="w-5 h-5 accent-red-600"
                    />
                    <label htmlFor="modal-sold-out" className="text-sm font-bold theme-text-primary cursor-pointer select-none" style={{ color: '#ef4444' }}>
                      🚫 Mark as SOLD OUT
                    </label>
                  </div>

                  {/* Abandoned Status */}
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-secondary)' }}>
                    <input
                      type="checkbox"
                      id="modal-abandoned"
                      checked={isAbandoned}
                      onChange={(e) => setIsAbandoned(e.target.checked)}
                      className="w-5 h-5 accent-gray-600"
                    />
                    <label htmlFor="modal-abandoned" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">
                      🏚️ Mark as ABANDONED
                    </label>
                  </div>

                  {/* Paid Item Status */}
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2" style={{ borderColor: 'var(--theme-gradient-4)', background: 'var(--theme-card-bg)' }}>
                    <input
                      type="checkbox"
                      id="modal-paid"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="w-5 h-5 accent-yellow-600"
                    />
                    <label htmlFor="modal-paid" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">
                      💰 Mark as PAID ITEM (not free)
                    </label>
                  </div>

                  {/* Regular Item Status */}
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border-2" style={{ borderColor: 'var(--theme-gradient-4)', background: 'var(--theme-card-bg)' }}>
                    <input
                      type="checkbox"
                      id="modal-regular"
                      checked={isRegular}
                      onChange={(e) => setIsRegular(e.target.checked)}
                      className="w-5 h-5 accent-purple-600"
                    />
                    <label htmlFor="modal-regular" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">
                      ♾️ Mark as REGULAR (non-limited)
                    </label>
                  </div>
                </div>

                {/* Method */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold theme-text-secondary uppercase">Drop Methods</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 p-4 rounded-lg border-4 border-noob-orange theme-bg-card">
                    {METHOD_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={Array.isArray(formData.method) && formData.method.includes(opt.value)}
                          onChange={() => toggleMethod(opt.value)}
                          className="w-4 h-4 accent-blue-500"
                        />
                        <span className="text-sm font-bold theme-text-primary">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Code Input (Conditional) */}
                {Array.isArray(formData.method) && formData.method.includes(UGCMethod.CodeDrop) && (
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
                      disabled={isUnlimitedLimit}
                      className={`w-full px-4 py-3 rounded-lg border-4 font-bold focus:outline-none ${isUnlimitedLimit ? 'theme-bg-card border-gray-500 theme-text-secondary opacity-50' : 'theme-bg-card theme-text-primary'}`}
                      style={{ borderColor: isUnlimitedLimit ? 'gray' : 'var(--theme-gradient-4)' }}
                    />
                    <div className="flex items-center gap-2 whitespace-nowrap p-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                      <input
                        type="checkbox"
                        id="modal-unlimited"
                        checked={isUnlimitedLimit}
                        onChange={(e) => setIsUnlimitedLimit(e.target.checked)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <label htmlFor="modal-unlimited" className="text-sm font-bold theme-text-secondary cursor-pointer select-none">Unlimited</label>
                    </div>
                  </div>
                </div>

                {/* Game Links (Multiple) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold theme-text-secondary uppercase">🎮 Game Links</label>
                    <button
                      type="button"
                      onClick={addGameLink}
                      className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:scale-105 text-white"
                      style={{ background: 'var(--theme-gradient-2)' }}
                    >
                      + Add Link
                    </button>
                  </div>
                  {(formData.game_links || []).length === 0 && (
                    <p className="text-xs theme-text-secondary italic">No game links. Click &quot;+ Add Link&quot;.</p>
                  )}
                  {(formData.game_links || []).map((link, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs font-bold theme-text-secondary w-6 text-center">{idx + 1}.</span>
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateGameLink(idx, e.target.value)}
                        placeholder="https://www.roblox.com/games/..."
                        className="flex-1 px-4 py-3 rounded-lg border-4 font-bold theme-text-primary theme-bg-card focus:outline-none"
                        style={{ borderColor: 'var(--theme-gradient-2)' }}
                      />
                      <button
                        type="button"
                        onClick={() => removeGameLink(idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-lg px-2 transition-all hover:scale-110"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Item Link */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold theme-text-secondary uppercase">Item Link</label>
                  <input
                    type="url"
                    value={formData.item_link}
                    onChange={(e) => handleFormChange('item_link', e.target.value)}
                    placeholder="https://www.roblox.com/catalog/..."
                    className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary theme-bg-card focus:outline-none"
                    style={{ borderColor: 'var(--theme-gradient-3)' }}
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
                  className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary theme-bg-card focus:outline-none h-24 resize-none"
                  style={{ borderColor: 'var(--theme-primary)' }}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-bold theme-text-secondary uppercase">📷 Item Image</label>
                <CloudinaryUpload
                  onImageChange={(url) => handleFormChange('image_url', url)}
                  currentImageUrl={formData.image_url}
                />
              </div>

              {/* Screenshots Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-bold theme-text-secondary uppercase">🖼️ Screenshots</label>
                <div
                  className="p-6 rounded-xl border-4 border-dashed theme-bg-card transition-all cursor-pointer hover:opacity-80 text-center"
                  style={{ borderColor: 'var(--theme-gradient-4)' }}
                  onPaste={handleScreenshotPaste}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length > 0) handleScreenshotFiles(e.dataTransfer.files); }}
                  tabIndex={0}
                >
                  <p className="theme-text-secondary font-bold text-sm">📋 Paste from clipboard (Ctrl+V) or drag & drop</p>
                  <p className="theme-text-secondary text-xs mt-1 opacity-75">PNG, JPG, GIF, WebP</p>
                  <label className="mt-3 inline-block px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all hover:scale-105 text-white"
                    style={{ background: 'linear-gradient(135deg, var(--theme-gradient-3), var(--theme-gradient-4))' }}
                  >
                    📁 Browse Files
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { if (e.target.files) handleScreenshotFiles(e.target.files); e.target.value = ''; }}
                    />
                  </label>
                </div>
                {(formData.screenshots || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(formData.screenshots || []).map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                        <img
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-auto object-contain cursor-pointer transition-all hover:scale-105"
                          onClick={() => openImageViewer(url)}
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to preview
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {formData.item_name && (
                <div className="p-6 rounded-xl border-4 border-dashed space-y-3 theme-bg-card" style={{ borderColor: 'var(--theme-primary)' }}>
                  <p className="text-sm font-bold theme-text-secondary uppercase">Preview</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-24 h-24 object-contain rounded-lg border-2"
                      style={{ borderColor: 'var(--theme-secondary)' }}
                    />
                    <div>
                      <p className="font-black text-lg theme-text-primary">{formData.item_name}</p>
                      <p className="text-sm theme-text-secondary">by {formData.creator}</p>
                      <p className="text-xs theme-text-secondary mt-2 opacity-75">{formatLocalDateTime(formData.release_date_time)}</p>
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
          <div className="theme-bg-card w-full max-w-md rounded-2xl shadow-2xl relative z-10 pop-in overflow-hidden border-4" style={{ borderColor: '#dc2626' }}>
            <div className="bg-red-600 p-6 text-white text-center">
              <div className="text-5xl mb-2">🗑️</div>
              <h2 className="text-2xl font-black uppercase">Confirm Delete</h2>
            </div>
            <div className="p-8 text-center space-y-6">
              <p className="theme-text-primary font-bold text-lg">
                Are you sure you want to delete this schedule?
                <br />
                <span className="text-sm theme-text-secondary font-normal">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 px-4 py-3 border-2 theme-text-primary font-bold rounded-lg uppercase tracking-wide transition-all" style={{ borderColor: 'var(--theme-secondary)' }}>
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

      {/* --- IMAGE VIEWER MODAL --- */}
      {viewerImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all">
          <button
            onClick={closeImageViewer}
            className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 rounded-full p-3 transition-all transform hover:scale-110 z-10"
          >
            ✕
          </button>
          
          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 bg-black/50 p-3 rounded-full backdrop-blur-sm z-10">
            <button 
              onClick={() => setViewerZoom(prev => Math.max(0.5, prev - 0.25))}
              className="w-10 h-10 flex items-center justify-center text-white bg-white/20 hover:bg-white/40 rounded-full font-bold transition-all"
              title="Zoom Out"
            >
              -
            </button>
            <button 
              onClick={() => setViewerZoom(1)}
              className="px-4 h-10 flex items-center justify-center text-white bg-white/20 hover:bg-white/40 rounded-full font-bold text-sm transition-all"
              title="Reset Zoom"
            >
              {Math.round(viewerZoom * 100)}%
            </button>
            <button 
              onClick={() => setViewerZoom(prev => Math.min(3, prev + 0.25))}
              className="w-10 h-10 flex items-center justify-center text-white bg-white/20 hover:bg-white/40 rounded-full font-bold transition-all"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <div 
            className="w-full h-full flex items-center justify-center overflow-auto cursor-zoom-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeImageViewer();
            }}
          >
            <img 
              src={viewerImage} 
              alt="Expanded view" 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${viewerZoom})`, cursor: viewerZoom > 1 ? 'grab' : 'zoom-in' }}
              onClick={() => setViewerZoom(prev => prev === 1 ? 2 : 1)}
            />
          </div>
        </div>
      )}

    </div>
  );
}