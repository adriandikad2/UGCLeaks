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

// ISO 3166-1 alpha-2 country codes with names
const COUNTRY_OPTIONS: { code: string; name: string; flag: string }[] = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'CV', name: 'Cabo Verde', flag: '🇨🇻' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo (DRC)', flag: '🇨🇩' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czechia', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts & Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'St Vincent & Grenadines', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'São Tomé & Príncipe', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
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
  region_lock?: string | null; // ISO 3166-1 alpha-2 country code for region lock
  restock_info?: { enabled: boolean; mode?: 'auto' | 'manual'; manual_type?: 'hours' | 'date'; interval_hours: number; restock_amount: number; next_restock_time?: string | null; second_restock_time?: string | null } | null;
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
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Helper: Get current local time as "YYYY-MM-DDTHH:mm" for datetime-local inputs
const getCurrentLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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
    region_lock: null,
    restock_info: null,
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
    let restockPayload = null;
    if (formData.restock_info?.enabled) {
      const mode = formData.restock_info.mode === 'manual' ? 'manual' : 'auto';
      const manual_type = formData.restock_info.manual_type === 'date' ? 'date' : 'hours';
      let utcNextRestock: string | null = null;
      if (mode === 'manual' && formData.restock_info.next_restock_time) {
        const localRestockDate = new Date(formData.restock_info.next_restock_time);
        if (!isNaN(localRestockDate.getTime())) {
          utcNextRestock = localRestockDate.toISOString();
        }
      }
      let utcSecondRestock: string | null = null;
      if (mode === 'manual' && manual_type === 'date' && formData.restock_info.second_restock_time) {
        const localSecondDate = new Date(formData.restock_info.second_restock_time);
        if (!isNaN(localSecondDate.getTime())) {
          utcSecondRestock = localSecondDate.toISOString();
        }
      }
      let interval = formData.restock_info.interval_hours || 0;
      if (mode === 'manual' && manual_type === 'date' && utcNextRestock && utcSecondRestock) {
        const d1 = new Date(utcNextRestock).getTime();
        const d2 = new Date(utcSecondRestock).getTime();
        if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
          interval = Number(((d2 - d1) / 3600000).toFixed(2));
        }
      }
      restockPayload = {
        ...formData.restock_info,
        mode,
        manual_type,
        interval_hours: interval,
        next_restock_time: utcNextRestock,
        second_restock_time: utcSecondRestock,
      };
    }

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
      region_lock: formData.region_lock || null,
      restock_info: restockPayload,
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
      region_lock: item.region_lock || null,
      restock_info: item.restock_info ? {
        ...item.restock_info,
        mode: item.restock_info.mode || (item.restock_info.next_restock_time ? 'manual' : 'auto'),
        manual_type: item.restock_info.manual_type || (item.restock_info.second_restock_time ? 'date' : 'hours'),
        next_restock_time: item.restock_info.next_restock_time ? toLocalInputString(item.restock_info.next_restock_time) : '',
        second_restock_time: item.restock_info.second_restock_time ? toLocalInputString(item.restock_info.second_restock_time) : '',
      } : null,
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
      region_lock: null,
      restock_info: null,
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

  const handleToggleSoldOut = async (item: UGCItem) => {
    const targetId = String(item.uuid || item.id);
    if (!targetId) return;
    setIsLoading(true);
    const newSoldOut = !item.sold_out;
    try {
      const result = await updateScheduledItem(targetId, { sold_out: newSoldOut } as any);
      if (result) {
        setScheduledItems(prev => prev.map(i => (String(i.uuid || i.id) === targetId ? { ...i, sold_out: newSoldOut } : i)));
        addToast(`Item marked as ${newSoldOut ? 'SOLD OUT' : 'AVAILABLE'}!`, 'success');
      } else {
        addToast('Failed to update sold out status.', 'error');
      }
    } catch (e) {
      addToast('Error updating status.', 'error');
    } finally {
      setIsLoading(false);
    }
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

      <div className="max-w-[88rem] mx-auto px-4 relative z-10">
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
        <div ref={formRef} className="mb-8 p-6 theme-bg-card rounded-2xl shadow-2xl blocky-shadow space-y-5" style={{ border: '2px solid var(--theme-primary)' }}>
          <h2 className="text-2xl font-black theme-text-primary">➕ Create New Schedule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Item Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Item Name</label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => handleFormChange('item_name', e.target.value)}
                placeholder="e.g., Red Valkyrie Helm"
                className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-1)' }}
              />
            </div>

            {/* Creator */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Creator Name</label>
              <input
                type="text"
                value={formData.creator}
                onChange={(e) => handleFormChange('creator', e.target.value)}
                placeholder="e.g., RobloxianCreations"
                className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-2)' }}
              />
            </div>

            {/* Release Date & Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Release Date & Time</label>
              <div className="flex gap-2 items-center">
                <input
                  type="datetime-local"
                  step="1"
                  value={formData.release_date_time}
                  onChange={(e) => handleFormChange('release_date_time', e.target.value)}
                  disabled={isUnknownSchedule}
                  className={`w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card ${isUnknownSchedule ? 'opacity-50 border-gray-500 theme-text-secondary' : ''}`}
                  style={!isUnknownSchedule ? { borderColor: 'var(--theme-gradient-3)' } : {}}
                />
                {/* Unknown Schedule Checkbox */}
                <div className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-3)' }}>
                  <input
                    type="checkbox"
                    id="unknown-schedule-check"
                    checked={isUnknownSchedule}
                    onChange={(e) => setIsUnknownSchedule(e.target.checked)}
                    className="w-4 h-4 accent-orange-600"
                  />
                  <label htmlFor="unknown-schedule-check" className="text-xs font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                </div>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Stock Amount</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={typeof formData.stock === 'number' ? formData.stock : 0}
                  onChange={(e) => handleFormChange('stock', parseInt(e.target.value))}
                  disabled={isUnknownStock}
                  className={`w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card ${isUnknownStock ? 'opacity-50 border-gray-500 theme-text-secondary' : ''}`}
                  style={!isUnknownStock ? { borderColor: 'var(--theme-gradient-4)' } : {}}
                />
                {/* Unknown Stock Checkbox */}
                <div className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                  <input
                    type="checkbox"
                    id="unknown-stock-check"
                    checked={isUnknownStock}
                    onChange={(e) => setIsUnknownStock(e.target.checked)}
                    className="w-4 h-4 accent-orange-600"
                  />
                  <label htmlFor="unknown-stock-check" className="text-xs font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                </div>
              </div>
            </div>

            {/* Limit Per User */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Limit Per User</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={formData.limit_per_user || 1}
                  onChange={(e) => handleFormChange('limit_per_user', parseInt(e.target.value))}
                  disabled={isUnlimitedLimit}
                  className={`w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base text-gray-900 focus:outline-none ${isUnlimitedLimit ? 'bg-gray-100 border-gray-300 text-gray-400' : 'border-blue-500'}`}
                />
                {/* The Checkbox Container */}
                <div className="flex items-center gap-1.5 whitespace-nowrap bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="unlimited-check"
                    checked={isUnlimitedLimit}
                    onChange={(e) => setIsUnlimitedLimit(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="unlimited-check" className="text-xs font-bold text-gray-700 cursor-pointer select-none">Unlimited</label>
                </div>
              </div>
            </div>

            {/* Region Lock */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Region Lock</label>
              <select
                value={formData.region_lock || ''}
                onChange={(e) => handleFormChange('region_lock', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-accent)' }}
              >
                <option value="">🌍 Global (No Region Lock)</option>
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Link */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Item Link</label>
              <input
                type="url"
                value={formData.item_link}
                onChange={(e) => handleFormChange('item_link', e.target.value)}
                placeholder="https://www.roblox.com/catalog/..."
                className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                style={{ borderColor: 'var(--theme-gradient-2)' }}
              />
            </div>

            {/* Drop Methods (Spans full width on lg) */}
            <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Drop Methods</label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 p-2.5 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-secondary)' }}>
                {METHOD_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={Array.isArray(formData.method) && formData.method.includes(opt.value)}
                      onChange={() => toggleMethod(opt.value)}
                      className="w-4 h-4 accent-blue-500 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm font-bold theme-text-primary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Code Input (Conditional) */}
            {Array.isArray(formData.method) && formData.method.includes(UGCMethod.CodeDrop) && (
              <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Code Drop Secret</label>
                <input
                  type="text"
                  value={formData.ugc_code || ''}
                  onChange={(e) => handleFormChange('ugc_code', e.target.value)}
                  placeholder="Enter Code..."
                  className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                  style={{ borderColor: 'var(--theme-accent)' }}
                />
              </div>
            )}

            {/* Status Flags Horizontal Row */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              {/* Sold Out */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: '#ef4444' }}>
                <input
                  type="checkbox"
                  checked={isSoldOut}
                  onChange={(e) => setIsSoldOut(e.target.checked)}
                  className="w-4 h-4 accent-red-600 flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-bold truncate" style={{ color: '#ef4444' }}>🚫 Mark SOLD OUT</span>
              </label>

              {/* Abandoned */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-secondary)' }}>
                <input
                  type="checkbox"
                  checked={isAbandoned}
                  onChange={(e) => setIsAbandoned(e.target.checked)}
                  className="w-4 h-4 accent-gray-600 flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-bold theme-text-secondary truncate">🏚️ Mark ABANDONED</span>
              </label>

              {/* Paid */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 accent-yellow-600 flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-bold theme-text-secondary truncate">💰 Mark PAID ITEM</span>
              </label>

              {/* Regular */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                <input
                  type="checkbox"
                  checked={isRegular}
                  onChange={(e) => setIsRegular(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-bold theme-text-secondary truncate">♾️ Mark REGULAR</span>
              </label>
            </div>

            {/* Restock Configuration */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-gradient-2)' }}>
                <input
                  type="checkbox"
                  checked={formData.restock_info?.enabled || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleFormChange('restock_info', { enabled: true, interval_hours: 12, restock_amount: 100 });
                    } else {
                      handleFormChange('restock_info', null);
                    }
                  }}
                  className="w-4 h-4 accent-green-600 flex-shrink-0"
                />
                <span className="text-xs md:text-sm font-bold theme-text-primary">🔄 Enable Restock Schedule</span>
              </label>
              {formData.restock_info?.enabled && (() => {
                const mode = formData.restock_info.mode || (formData.restock_info.next_restock_time ? 'manual' : 'auto');
                const manual_type = formData.restock_info.manual_type || (formData.restock_info.second_restock_time ? 'date' : 'hours');
                return (
                  <div className="p-4 rounded-xl border-2 theme-bg-card space-y-4" style={{ borderColor: 'var(--theme-gradient-2)' }}>
                    {/* Top Row: Amount & Mode Choice */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b theme-border-secondary">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">📦 Amount Per Restock</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.restock_info.restock_amount}
                          onChange={(e) => handleFormChange('restock_info', { ...formData.restock_info!, restock_amount: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                          style={{ borderColor: 'var(--theme-gradient-2)' }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🛠️ Restock Timing Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, mode: 'auto', next_restock_time: '', second_restock_time: '' })}
                            className={`p-2 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'auto' ? 'theme-bg-secondary text-white border-transparent' : 'theme-bg-card theme-text-secondary border-dashed'}`}
                            style={mode === 'auto' ? { background: 'var(--theme-gradient-2)' } : { borderColor: 'var(--theme-border-secondary)' }}
                          >
                            🔄 Auto from Release
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, mode: 'manual' })}
                            className={`p-2 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'manual' ? 'theme-bg-secondary text-white border-transparent' : 'theme-bg-card theme-text-secondary border-dashed'}`}
                            style={mode === 'manual' ? { background: 'var(--theme-gradient-2)' } : { borderColor: 'var(--theme-border-secondary)' }}
                          >
                            📅 Manual Anchor
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mode Content */}
                    {mode === 'auto' ? (
                      <div className="space-y-1">
                        <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">⏱️ Auto Every (Hours) starting from item release</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g. 12 or 24"
                          value={formData.restock_info.interval_hours || ''}
                          onChange={(e) => handleFormChange('restock_info', { ...formData.restock_info!, interval_hours: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                          style={{ borderColor: 'var(--theme-gradient-2)' }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">📅 1st Manual Restock Time (Anchor Time)</label>
                          <input
                            type="datetime-local"
                            step="1"
                            value={formData.restock_info.next_restock_time || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              let calcInterval = formData.restock_info!.interval_hours;
                              if (manual_type === 'date' && val && formData.restock_info!.second_restock_time) {
                                const d1 = new Date(val).getTime();
                                const d2 = new Date(formData.restock_info!.second_restock_time).getTime();
                                if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
                                  calcInterval = Number(((d2 - d1) / 3600000).toFixed(2));
                                }
                              }
                              handleFormChange('restock_info', { ...formData.restock_info!, next_restock_time: val, interval_hours: calcInterval });
                            }}
                            className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                            style={{ borderColor: 'var(--theme-gradient-2)' }}
                          />
                        </div>

                        {/* Recurring Condition Branch */}
                        <div className="p-3 rounded-lg border theme-border-secondary theme-bg-card space-y-3">
                          <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🔁 Recurring Condition (Subsequent Restocks)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, manual_type: 'hours', second_restock_time: '' })}
                              className={`p-2 rounded border text-xs font-bold transition-all ${manual_type === 'hours' ? 'theme-text-primary border-2' : 'theme-text-secondary opacity-70 border'}`}
                              style={manual_type === 'hours' ? { borderColor: 'var(--theme-gradient-2)' } : {}}
                            >
                              ⏱️ Auto Every (Hours)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, manual_type: 'date' })}
                              className={`p-2 rounded border text-xs font-bold transition-all ${manual_type === 'date' ? 'theme-text-primary border-2' : 'theme-text-secondary opacity-70 border'}`}
                              style={manual_type === 'date' ? { borderColor: 'var(--theme-gradient-2)' } : {}}
                            >
                              📅 2nd Manual Date
                            </button>
                          </div>

                          {manual_type === 'hours' ? (
                            <div className="space-y-1 pt-1">
                              <label className="block text-xs font-bold theme-text-secondary">⏱️ Repeat Every (Hours) e.g. 24h loops identical time next day</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="e.g. 24"
                                value={formData.restock_info.interval_hours || ''}
                                onChange={(e) => handleFormChange('restock_info', { ...formData.restock_info!, interval_hours: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 rounded border-2 font-bold text-sm theme-text-primary focus:outline-none theme-bg-card"
                                style={{ borderColor: 'var(--theme-gradient-2)' }}
                              />
                            </div>
                          ) : (
                            <div className="space-y-1 pt-1">
                              <label className="block text-xs font-bold theme-text-secondary">📅 2nd Restock Time (Calculates interval automatically)</label>
                              <input
                                type="datetime-local"
                                step="1"
                                disabled={!formData.restock_info.next_restock_time}
                                value={formData.restock_info.second_restock_time || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let calcInterval = formData.restock_info!.interval_hours;
                                  if (formData.restock_info!.next_restock_time && val) {
                                    const d1 = new Date(formData.restock_info!.next_restock_time).getTime();
                                    const d2 = new Date(val).getTime();
                                    if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
                                      calcInterval = Number(((d2 - d1) / 3600000).toFixed(2));
                                    }
                                  }
                                  handleFormChange('restock_info', { ...formData.restock_info!, second_restock_time: val, interval_hours: calcInterval });
                                }}
                                className="w-full px-3 py-2 rounded border-2 font-bold text-sm theme-text-primary focus:outline-none theme-bg-card"
                                style={{ borderColor: 'var(--theme-gradient-2)' }}
                              />
                              {formData.restock_info.interval_hours > 0 && (
                                <p className="text-xs font-bold theme-text-secondary mt-1">✓ Calculated Interval: <span style={{ color: 'var(--theme-gradient-2)' }}>Every {formData.restock_info.interval_hours} hours</span></p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Next Restock Preview */}
                    <div className="pt-2 border-t theme-border-secondary flex items-center justify-between">
                      <span className="text-xs font-bold theme-text-secondary uppercase tracking-wider">🕐 Next Restock Preview:</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--theme-gradient-2)' }}>
                        {(() => {
                          const now = new Date();
                          if (mode === 'manual') {
                            if (!formData.restock_info.next_restock_time) return '⚠️ Pick 1st manual time';
                            if (!formData.restock_info.interval_hours || formData.restock_info.interval_hours <= 0) return '⚠️ Set recurring hours / 2nd date';
                            const manualDate = new Date(formData.restock_info.next_restock_time);
                            if (isNaN(manualDate.getTime())) return '⚠️ Invalid date';
                            const diff = manualDate.getTime() - now.getTime();
                            if (diff > 0) {
                              const h = Math.floor(diff / 3600000);
                              const m = Math.floor((diff % 3600000) / 60000);
                              const s = Math.floor((diff % 60000) / 1000);
                              const parts = [];
                              if (h > 0) parts.push(`${h}h`);
                              parts.push(`${m}m`);
                              parts.push(`${s}s`);
                              return `in ${parts.join(' ')} (Loops every ${formData.restock_info.interval_hours}h)`;
                            } else {
                              const intervalMs = formData.restock_info.interval_hours * 3600000;
                              const elapsed = now.getTime() - manualDate.getTime();
                              const cyclesPassed = Math.floor(elapsed / intervalMs);
                              const nextRestock = new Date(manualDate.getTime() + (cyclesPassed + 1) * intervalMs);
                              const nextDiff = nextRestock.getTime() - now.getTime();
                              const h = Math.floor(nextDiff / 3600000);
                              const m = Math.floor((nextDiff % 3600000) / 60000);
                              const s = Math.floor((nextDiff % 60000) / 1000);
                              const parts = [];
                              if (h > 0) parts.push(`${h}h`);
                              parts.push(`${m}m`);
                              parts.push(`${s}s`);
                              return `in ${parts.join(' ')} (Loops every ${formData.restock_info.interval_hours}h)`;
                            }
                          }
                          if (!formData.release_date_time || isUnknownSchedule) return '❓ Unknown (no release date)';
                          const release = new Date(formData.release_date_time);
                          const intervalMs = (formData.restock_info.interval_hours || 0) * 3600000;
                          if (intervalMs <= 0) return '⚠️ Enter auto hours';
                          if (release > now) return `After release (every ${formData.restock_info.interval_hours}h)`;
                          const elapsed = now.getTime() - release.getTime();
                          const cyclesPassed = Math.floor(elapsed / intervalMs);
                          const nextRestock = new Date(release.getTime() + (cyclesPassed + 1) * intervalMs);
                          const diff = nextRestock.getTime() - now.getTime();
                          const h = Math.floor(diff / 3600000);
                          const m = Math.floor((diff % 3600000) / 60000);
                          const s = Math.floor((diff % 60000) / 1000);
                          const parts = [];
                          if (h > 0) parts.push(`${h}h`);
                          parts.push(`${m}m`);
                          parts.push(`${s}s`);
                          return `in ${parts.join(' ')}`;
                        })()}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Game Links (Full Width) */}
            <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🎮 Game Links</label>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(formData.game_links || []).map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-xs font-bold theme-text-secondary w-5 text-center flex-shrink-0">{idx + 1}.</span>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateGameLink(idx, e.target.value)}
                      placeholder="https://www.roblox.com/games/..."
                      className="flex-1 px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card min-w-0"
                      style={{ borderColor: 'var(--theme-gradient-1)' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeGameLink(idx)}
                      className="text-red-500 hover:text-red-700 font-bold text-base px-2 transition-all hover:scale-110 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side-by-Side How to Get It & Image Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* Instructions */}
            <div className="space-y-1.5 flex flex-col">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">How to Get It</label>
              <textarea
                value={formData.instruction}
                onChange={(e) => handleFormChange('instruction', e.target.value)}
                placeholder="Instructions for obtaining the item..."
                className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none h-32 resize-y theme-bg-card flex-1"
                style={{ borderColor: 'var(--theme-gradient-3)' }}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">📷 Item Image</label>
              <CloudinaryUpload
                onImageChange={(url) => handleFormChange('image_url', url)}
                currentImageUrl={formData.image_url}
              />
            </div>
          </div>

          {/* Screenshots Upload */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🖼️ Screenshots</label>
            <div
              className="p-4 rounded-xl border-2 border-dashed theme-bg-card transition-all cursor-pointer hover:opacity-80 text-center"
              style={{ borderColor: 'var(--theme-gradient-4)' }}
              onPaste={handleScreenshotPaste}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length > 0) handleScreenshotFiles(e.dataTransfer.files); }}
              tabIndex={0}
            >
              <p className="theme-text-secondary font-bold text-xs md:text-sm">📋 Paste from clipboard (Ctrl+V) or drag & drop images here</p>
              <label className="mt-2 inline-block px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm cursor-pointer transition-all hover:scale-105 text-white shadow"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {(formData.screenshots || []).map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                    <img
                      src={url}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-16 object-contain cursor-pointer transition-all hover:scale-105"
                      onClick={() => openImageViewer(url)}
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {formData.item_name && (
            <div className="p-4 theme-bg-card rounded-xl border-2 border-dashed space-y-2" style={{ borderColor: 'var(--theme-secondary)' }}>
              <p className="text-xs font-bold theme-text-secondary uppercase tracking-wider">Preview</p>
              <div className="flex items-center gap-3">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-16 h-16 object-contain rounded-lg border" style={{ borderColor: 'var(--theme-secondary)' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-black text-base theme-text-primary truncate">{formData.item_name}</p>
                  <p className="text-xs font-bold theme-text-secondary truncate">by {formData.creator}</p>
                  <p className="text-xs theme-text-secondary mt-1">{formatLocalDateTime(formData.release_date_time)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Add Button - Creation only */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={handleAddSchedule}
              disabled={isLoading || editingId !== null}
              className="flex-1 gradient-button px-6 py-3 text-base rounded-xl font-black uppercase tracking-wider blocky-shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

                      <div className="p-4 flex-1 flex flex-col gap-3">
                        {/* Compact Header: Image + Title/Creator */}
                        <div className="flex items-center gap-3">
                          <div
                            className="p-1.5 rounded-lg border-2 flex-shrink-0"
                            style={{ borderColor: primaryColor, backgroundColor: 'var(--theme-card-bg)' }}
                          >
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-14 h-14 object-contain rounded"
                              width={56}
                              height={56}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            {item.item_link ? (
                              <Link href={item.item_link} target="_blank" rel="noopener noreferrer">
                                <h2
                                  className="text-lg font-black leading-tight hover:underline cursor-pointer truncate"
                                  style={{ color: primaryColor }}
                                  title={item.item_name}
                                >
                                  {item.item_name}
                                </h2>
                              </Link>
                            ) : (
                              <h2
                                className="text-lg font-black leading-tight truncate"
                                style={{ color: primaryColor }}
                                title={item.item_name}
                              >
                                {item.item_name}
                              </h2>
                            )}
                            <p className="text-xs font-bold theme-text-secondary truncate mt-0.5">
                              by <span style={{ color: primaryColor }}>{item.creator}</span>
                            </p>
                          </div>
                        </div>

                        {/* Compact Data Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Stock */}
                          <div className="p-2 rounded border theme-bg-card flex justify-between items-center" style={{ borderColor: shuffledColors[0] }}>
                            <span className="font-bold theme-text-secondary">📦 Stock:</span>
                            <span className="font-black truncate" style={{ color: item.sold_out ? 'var(--theme-text-secondary)' : shuffledColors[0] }}>
                              {item.sold_out ? `0/${item.stock || '?'}` : (typeof item.stock === 'number' ? item.stock : 'OUT')}
                            </span>
                          </div>

                          {/* Relative Time */}
                          <div className="p-2 rounded border theme-bg-card flex justify-between items-center" style={{ borderColor: shuffledColors[1] }}>
                            <span className="font-bold theme-text-secondary">⏰ In:</span>
                            <span className="font-black truncate" style={{ color: shuffledColors[1] }}>
                              {formatRelativeTime(item.release_date_time)}
                            </span>
                          </div>

                          {/* Method */}
                          <div className="p-2 rounded border theme-bg-card flex justify-between items-center" style={{ borderColor: shuffledColors[2] }}>
                            <span className="font-bold theme-text-secondary">🎯 Method:</span>
                            <span className="font-black truncate" style={{ color: shuffledColors[2] }}>
                              {(Array.isArray(item.method) ? item.method : [item.method || UGCMethod.Unknown]).map(m => {
                                if (m === UGCMethod.WebDrop) return '🌐 Web';
                                if (m === UGCMethod.InGame) return '🎮 Game';
                                if (m === UGCMethod.CodeDrop) return '🗝️ Code';
                                if (m === UGCMethod.Quest) return '🏰 Quest';
                                if (m === UGCMethod.Launcher) return '🚀 Launch';
                                if (m === UGCMethod.JoinAndClaim) return '🤝 J&C';
                                if (m === UGCMethod.TwitchPoints) return '🟪 Twitch';
                                return `❓ ${m}`;
                              }).join(', ')}
                            </span>
                          </div>

                          {/* Limit */}
                          <div className="p-2 rounded border theme-bg-card flex justify-between items-center" style={{ borderColor: shuffledColors[3] }}>
                            <span className="font-bold theme-text-secondary">🔢 Limit:</span>
                            <span className="font-black truncate" style={{ color: shuffledColors[3] }}>
                              {(item.limit_per_user === null || item.limit_per_user === -1) ? '∞' : `${item.limit_per_user}x`}
                            </span>
                          </div>
                        </div>

                        {/* Restock Info (if enabled) */}
                        {item.restock_info?.enabled && (
                          <div className="p-2 rounded border theme-bg-card text-xs flex flex-col gap-1" style={{ borderColor: shuffledColors[1] }}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold theme-text-secondary">🔄 Restock:</span>
                              <span className="font-black" style={{ color: shuffledColors[1] }}>
                                {item.restock_info.next_restock_time ? 'Manual Time' : `Every ${item.restock_info.interval_hours}h`} · {item.restock_info.restock_amount} units
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t theme-border-secondary">
                              <span className="font-bold theme-text-secondary">🕐 Next:</span>
                              <span className="font-black" style={{ color: shuffledColors[2] }}>
                                {(() => {
                                  const now = new Date();
                                  if (item.restock_info.next_restock_time) {
                                    let manualStr = item.restock_info.next_restock_time;
                                    if (!manualStr.endsWith('Z') && !manualStr.includes('+') && !manualStr.includes('-', 10)) {
                                      manualStr = manualStr.replace(' ', 'T') + 'Z';
                                    }
                                    const manualDate = new Date(manualStr);
                                    if (isNaN(manualDate.getTime())) return '⚠️';
                                    const diff = manualDate.getTime() - now.getTime();
                                    if (diff > 0) {
                                      const h = Math.floor(diff / 3600000);
                                      const m = Math.floor((diff % 3600000) / 60000);
                                      const s = Math.floor((diff % 60000) / 1000);
                                      const parts = [];
                                      if (h > 0) parts.push(`${h}h`);
                                      parts.push(`${m}m`);
                                      parts.push(`${s}s`);
                                      return `in ${parts.join(' ')}`;
                                    } else {
                                      const intervalMs = (item.restock_info.interval_hours || 0) * 3600000;
                                      if (intervalMs <= 0) return 'Passed';
                                      const elapsed = now.getTime() - manualDate.getTime();
                                      const cyclesPassed = Math.floor(elapsed / intervalMs);
                                      const nextRestock = new Date(manualDate.getTime() + (cyclesPassed + 1) * intervalMs);
                                      const nextDiff = nextRestock.getTime() - now.getTime();
                                      const h = Math.floor(nextDiff / 3600000);
                                      const m = Math.floor((nextDiff % 3600000) / 60000);
                                      const s = Math.floor((nextDiff % 60000) / 1000);
                                      const parts = [];
                                      if (h > 0) parts.push(`${h}h`);
                                      parts.push(`${m}m`);
                                      parts.push(`${s}s`);
                                      return `in ${parts.join(' ')}`;
                                    }
                                  }
                                  if (!item.release_date_time || item.release_date_time.startsWith('9999')) return '❓';
                                  let dateStr = item.release_date_time;
                                  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
                                    dateStr = dateStr.replace(' ', 'T') + 'Z';
                                  }
                                  const release = new Date(dateStr);
                                  const intervalMs = item.restock_info.interval_hours * 3600000;
                                  if (intervalMs <= 0) return '⚠️';
                                  if (release > now) return 'After release';
                                  const elapsed = now.getTime() - release.getTime();
                                  const cyclesPassed = Math.floor(elapsed / intervalMs);
                                  const nextRestock = new Date(release.getTime() + (cyclesPassed + 1) * intervalMs);
                                  const diff = nextRestock.getTime() - now.getTime();
                                  const h = Math.floor(diff / 3600000);
                                  const m = Math.floor((diff % 3600000) / 60000);
                                  const s = Math.floor((diff % 60000) / 1000);
                                  const parts = [];
                                  if (h > 0) parts.push(`${h}h`);
                                  parts.push(`${m}m`);
                                  parts.push(`${s}s`);
                                  return `in ${parts.join(' ')}`;
                                })()}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Exact Time & Region Lock inline */}
                        <div className="p-2 rounded border theme-bg-card text-xs flex flex-col gap-1" style={{ borderColor: shuffledColors[0] }}>
                          <div className="flex justify-between items-center">
                            <span className="font-bold theme-text-secondary">📅 Exact:</span>
                            <span className="theme-text-primary font-medium truncate">{formatLocalDateTime(item.release_date_time)}</span>
                          </div>
                          {item.region_lock && (
                            <div className="flex justify-between items-center pt-1 border-t theme-border-secondary">
                              <span className="font-bold theme-text-secondary">🌍 Region:</span>
                              <span className="theme-text-primary font-medium">
                                {(() => {
                                  const country = COUNTRY_OPTIONS.find(c => c.code === item.region_lock);
                                  return country ? `${country.flag} ${country.name}` : item.region_lock;
                                })()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Game Links (Compact) */}
                        {(() => {
                          const links = Array.isArray(item.game_links) && item.game_links.length > 0
                            ? item.game_links.filter(l => l && l.length > 0)
                            : (item.game_link ? [item.game_link] : []);
                          if (links.length > 0) {
                            return (
                              <div className="p-2 rounded border theme-bg-card text-xs space-y-1" style={{ borderColor: shuffledColors[1] }}>
                                <span className="font-bold theme-text-secondary block">🔗 Game Links ({links.length}):</span>
                                {links.map((link, idx) => (
                                  <a
                                    key={idx}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold truncate hover:underline block text-blue-500"
                                    style={{ color: primaryColor }}
                                  >
                                    {idx + 1}. {link}
                                  </a>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Instructions (Collapsible/Compact) */}
                        {item.instruction && (
                          <div className="p-2 rounded border theme-bg-card text-xs" style={{ borderColor: shuffledColors[2] }}>
                            <span className="font-bold theme-text-secondary block mb-1">📖 How to Get It:</span>
                            <div className="theme-text-primary font-medium line-clamp-2 whitespace-pre-wrap">
                              <ClickableInstructions text={item.instruction} color={primaryColor} />
                            </div>
                          </div>
                        )}

                        {/* Screenshots (Compact thumbnails) */}
                        {Array.isArray(item.screenshots) && item.screenshots.length > 0 && (
                          <div className="flex gap-1.5 overflow-x-auto py-1">
                            {item.screenshots.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Screenshot ${idx + 1}`}
                                className="w-12 h-12 object-cover rounded cursor-pointer border hover:scale-110 transition-all flex-shrink-0"
                                style={{ borderColor: shuffledColors[3] }}
                                onClick={() => openImageViewer(url)}
                              />
                            ))}
                          </div>
                        )}

                        {/* Action Buttons (Compact & Sticky at bottom) */}
                        <div className="flex flex-col gap-1.5 mt-auto pt-2 border-t theme-border-secondary">
                          {/* Quick Mark Sold Out Toggle */}
                          <button
                            onClick={() => handleToggleSoldOut(item)}
                            className={`w-full py-1.5 px-3 text-white font-black rounded transition-all text-xs uppercase tracking-wide shadow ${
                              item.sold_out ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                            }`}
                          >
                            {item.sold_out ? '✅ Unmark Sold Out' : '🚫 Mark as Sold Out'}
                          </button>

                          <div className="flex gap-1.5">
                            {item.item_link ? (
                              <Link href={item.item_link} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <button
                                  className="w-full py-1.5 px-2 text-white font-black rounded transition-all text-xs uppercase tracking-wide truncate"
                                  style={{ background: gradientStr }}
                                >
                                  🛍️ View Item
                                </button>
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="flex-1 py-1.5 px-2 theme-text-secondary font-black rounded text-xs uppercase tracking-wide theme-bg-card cursor-not-allowed opacity-50 border truncate"
                                style={{ borderColor: 'var(--theme-secondary)' }}
                              >
                                🛍️ View Item
                              </button>
                            )}

                            {/* Join Game Button */}
                            {(() => {
                              const links = Array.isArray(item.game_links) && item.game_links.length > 0
                                ? item.game_links.filter(l => l && l.length > 0)
                                : (item.game_link ? [item.game_link] : []);
                              if (links.length === 0) {
                                return (
                                  <button
                                    disabled
                                    className="flex-1 py-1.5 px-2 theme-text-secondary font-black rounded text-xs uppercase tracking-wide theme-bg-card cursor-not-allowed opacity-50 border truncate"
                                    style={{ borderColor: 'var(--theme-secondary)' }}
                                  >
                                    🎮 Join
                                  </button>
                                );
                              }
                              return (
                                <Link href={links[0]} target="_blank" rel="noopener noreferrer" className="flex-1">
                                  <button
                                    className="w-full py-1.5 px-2 text-white font-black rounded transition-all text-xs uppercase tracking-wide truncate"
                                    style={{ background: gradientStr }}
                                  >
                                    🎮 Join
                                  </button>
                                </Link>
                              );
                            })()}
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleEditSchedule(item)}
                              className="flex-1 py-1.5 px-2 text-white font-black rounded transition-all text-xs uppercase tracking-wide bg-blue-600 hover:bg-blue-700 truncate"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleRemoveSchedule(String(item.uuid || item.id || ''))}
                              className="flex-1 py-1.5 px-2 text-white font-black rounded transition-all text-xs uppercase tracking-wide bg-red-600 hover:bg-red-700 truncate"
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
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Item Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Item Name</label>
                  <input
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => handleFormChange('item_name', e.target.value)}
                    placeholder="e.g., Red Valkyrie Helm"
                    className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary theme-bg-card focus:outline-none"
                    style={{ borderColor: 'var(--theme-gradient-1)' }}
                  />
                </div>

                {/* Creator */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Creator Name</label>
                  <input
                    type="text"
                    value={formData.creator}
                    onChange={(e) => handleFormChange('creator', e.target.value)}
                    placeholder="e.g., RobloxianCreations"
                    className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary theme-bg-card focus:outline-none"
                    style={{ borderColor: 'var(--theme-gradient-2)' }}
                  />
                </div>

                {/* Release Date & Time */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Release Date & Time</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="datetime-local"
                      step="1"
                      value={formData.release_date_time}
                      onChange={(e) => handleFormChange('release_date_time', e.target.value)}
                      disabled={isUnknownSchedule}
                      className={`w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card ${isUnknownSchedule ? 'opacity-50 border-gray-500 theme-text-secondary' : ''}`}
                      style={!isUnknownSchedule ? { borderColor: 'var(--theme-gradient-3)' } : {}}
                    />
                    <div className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-3)' }}>
                      <input
                        type="checkbox"
                        id="modal-unknown-schedule"
                        checked={isUnknownSchedule}
                        onChange={(e) => setIsUnknownSchedule(e.target.checked)}
                        className="w-4 h-4 accent-orange-600"
                      />
                      <label htmlFor="modal-unknown-schedule" className="text-xs font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Stock Amount</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={typeof formData.stock === 'number' ? formData.stock : 0}
                      onChange={(e) => handleFormChange('stock', parseInt(e.target.value))}
                      disabled={isUnknownStock}
                      className={`w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card ${isUnknownStock ? 'opacity-50 border-gray-500 theme-text-secondary' : ''}`}
                      style={!isUnknownStock ? { borderColor: 'var(--theme-gradient-4)' } : {}}
                    />
                    <div className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                      <input
                        type="checkbox"
                        id="modal-unknown-stock"
                        checked={isUnknownStock}
                        onChange={(e) => setIsUnknownStock(e.target.checked)}
                        className="w-4 h-4 accent-orange-600"
                      />
                      <label htmlFor="modal-unknown-stock" className="text-xs font-bold theme-text-secondary cursor-pointer select-none">Unknown</label>
                    </div>
                  </div>
                </div>

                {/* Limit Per User */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Limit Per User</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      value={formData.limit_per_user || 1}
                      onChange={(e) => handleFormChange('limit_per_user', parseInt(e.target.value))}
                      disabled={isUnlimitedLimit}
                      className={`w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base focus:outline-none ${isUnlimitedLimit ? 'theme-bg-card border-gray-500 theme-text-secondary opacity-50' : 'theme-bg-card theme-text-primary'}`}
                      style={{ borderColor: isUnlimitedLimit ? 'gray' : 'var(--theme-gradient-4)' }}
                    />
                    <div className="flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                      <input
                        type="checkbox"
                        id="modal-unlimited"
                        checked={isUnlimitedLimit}
                        onChange={(e) => setIsUnlimitedLimit(e.target.checked)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <label htmlFor="modal-unlimited" className="text-xs font-bold theme-text-secondary cursor-pointer select-none">Unlimited</label>
                    </div>
                  </div>
                </div>

                {/* Region Lock */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Region Lock</label>
                  <select
                    value={formData.region_lock || ''}
                    onChange={(e) => handleFormChange('region_lock', e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                    style={{ borderColor: 'var(--theme-accent)' }}
                  >
                    <option value="">🌍 Global (No Region Lock)</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Link */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Item Link</label>
                  <input
                    type="url"
                    value={formData.item_link}
                    onChange={(e) => handleFormChange('item_link', e.target.value)}
                    placeholder="https://www.roblox.com/catalog/..."
                    className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary theme-bg-card focus:outline-none"
                    style={{ borderColor: 'var(--theme-gradient-3)' }}
                  />
                </div>

                {/* Drop Methods (Spans full width on lg) */}
                <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Drop Methods</label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 p-2.5 rounded-lg border-2 theme-bg-card" style={{ borderColor: 'var(--theme-secondary)' }}>
                    {METHOD_OPTIONS.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={Array.isArray(formData.method) && formData.method.includes(opt.value)}
                          onChange={() => toggleMethod(opt.value)}
                          className="w-4 h-4 accent-blue-500 flex-shrink-0"
                        />
                        <span className="text-xs md:text-sm font-bold theme-text-primary">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Code Input (Conditional) */}
                {Array.isArray(formData.method) && formData.method.includes(UGCMethod.CodeDrop) && (
                  <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">Code Drop Secret</label>
                    <input
                      type="text"
                      value={formData.ugc_code || ''}
                      onChange={(e) => handleFormChange('ugc_code', e.target.value)}
                      placeholder="Enter Code..."
                      className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                      style={{ borderColor: 'var(--theme-accent)' }}
                    />
                  </div>
                )}

                {/* Status Flags Horizontal Row */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                  {/* Sold Out */}
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: '#ef4444' }}>
                    <input
                      type="checkbox"
                      checked={isSoldOut}
                      onChange={(e) => setIsSoldOut(e.target.checked)}
                      className="w-4 h-4 accent-red-600 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm font-bold truncate" style={{ color: '#ef4444' }}>🚫 Mark SOLD OUT</span>
                  </label>

                  {/* Abandoned */}
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={isAbandoned}
                      onChange={(e) => setIsAbandoned(e.target.checked)}
                      className="w-4 h-4 accent-gray-600 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm font-bold theme-text-secondary truncate">🏚️ Mark ABANDONED</span>
                  </label>

                  {/* Paid */}
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="w-4 h-4 accent-yellow-600 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm font-bold theme-text-secondary truncate">💰 Mark PAID ITEM</span>
                  </label>

                  {/* Regular */}
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                    <input
                      type="checkbox"
                      checked={isRegular}
                      onChange={(e) => setIsRegular(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm font-bold theme-text-secondary truncate">♾️ Mark REGULAR</span>
                  </label>
                </div>

                {/* Restock Configuration */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border-2 theme-bg-card cursor-pointer select-none transition-all hover:opacity-90" style={{ borderColor: 'var(--theme-gradient-2)' }}>
                    <input
                      type="checkbox"
                      checked={formData.restock_info?.enabled || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFormChange('restock_info', { enabled: true, interval_hours: 12, restock_amount: 100 });
                        } else {
                          handleFormChange('restock_info', null);
                        }
                      }}
                      className="w-4 h-4 accent-green-600 flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm font-bold theme-text-primary">🔄 Enable Restock Schedule</span>
                  </label>
                  {formData.restock_info?.enabled && (() => {
                    const mode = formData.restock_info.mode || (formData.restock_info.next_restock_time ? 'manual' : 'auto');
                    const manual_type = formData.restock_info.manual_type || (formData.restock_info.second_restock_time ? 'date' : 'hours');
                    return (
                      <div className="p-4 rounded-xl border-2 theme-bg-card space-y-4" style={{ borderColor: 'var(--theme-gradient-2)' }}>
                        {/* Top Row: Amount & Mode Choice */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b theme-border-secondary">
                          <div className="space-y-1">
                            <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">📦 Amount Per Restock</label>
                            <input
                              type="number"
                              min="1"
                              value={formData.restock_info.restock_amount}
                              onChange={(e) => handleFormChange('restock_info', { ...formData.restock_info!, restock_amount: parseInt(e.target.value) || 1 })}
                              className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                              style={{ borderColor: 'var(--theme-gradient-2)' }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🛠️ Restock Timing Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, mode: 'auto', next_restock_time: '', second_restock_time: '' })}
                                className={`p-2 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'auto' ? 'theme-bg-secondary text-white border-transparent' : 'theme-bg-card theme-text-secondary border-dashed'}`}
                                style={mode === 'auto' ? { background: 'var(--theme-gradient-2)' } : { borderColor: 'var(--theme-border-secondary)' }}
                              >
                                🔄 Auto from Release
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, mode: 'manual' })}
                                className={`p-2 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${mode === 'manual' ? 'theme-bg-secondary text-white border-transparent' : 'theme-bg-card theme-text-secondary border-dashed'}`}
                                style={mode === 'manual' ? { background: 'var(--theme-gradient-2)' } : { borderColor: 'var(--theme-border-secondary)' }}
                              >
                                📅 Manual Anchor
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Mode Content */}
                        {mode === 'auto' ? (
                          <div className="space-y-1">
                            <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">⏱️ Auto Every (Hours) starting from item release</label>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="e.g. 12 or 24"
                              value={formData.restock_info.interval_hours || ''}
                              onChange={(e) => handleFormChange('restock_info', { ...formData.restock_info!, interval_hours: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                              style={{ borderColor: 'var(--theme-gradient-2)' }}
                            />
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">📅 1st Manual Restock Time (Anchor Time)</label>
                              <input
                                type="datetime-local"
                                step="1"
                                value={formData.restock_info.next_restock_time || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let calcInterval = formData.restock_info!.interval_hours;
                                  if (manual_type === 'date' && val && formData.restock_info!.second_restock_time) {
                                    const d1 = new Date(val).getTime();
                                    const d2 = new Date(formData.restock_info!.second_restock_time).getTime();
                                    if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
                                      calcInterval = Number(((d2 - d1) / 3600000).toFixed(2));
                                    }
                                  }
                                  handleFormChange('restock_info', { ...formData.restock_info!, next_restock_time: val, interval_hours: calcInterval });
                                }}
                                className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary focus:outline-none theme-bg-card"
                                style={{ borderColor: 'var(--theme-gradient-2)' }}
                              />
                            </div>

                            {/* Recurring Condition Branch */}
                            <div className="p-3 rounded-lg border theme-border-secondary theme-bg-card space-y-3">
                              <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🔁 Recurring Condition (Subsequent Restocks)</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, manual_type: 'hours', second_restock_time: '' })}
                                  className={`p-2 rounded border text-xs font-bold transition-all ${manual_type === 'hours' ? 'theme-text-primary border-2' : 'theme-text-secondary opacity-70 border'}`}
                                  style={manual_type === 'hours' ? { borderColor: 'var(--theme-gradient-2)' } : {}}
                                >
                                  ⏱️ Auto Every (Hours)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFormChange('restock_info', { ...formData.restock_info!, manual_type: 'date' })}
                                  className={`p-2 rounded border text-xs font-bold transition-all ${manual_type === 'date' ? 'theme-text-primary border-2' : 'theme-text-secondary opacity-70 border'}`}
                                  style={manual_type === 'date' ? { borderColor: 'var(--theme-gradient-2)' } : {}}
                                >
                                  📅 2nd Manual Date
                                </button>
                              </div>

                              {manual_type === 'hours' ? (
                                <div className="space-y-1 pt-1">
                                  <label className="block text-xs font-bold theme-text-secondary">⏱️ Repeat Every (Hours) e.g. 24h loops identical time next day</label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="e.g. 24"
                                    value={formData.restock_info.interval_hours || ''}
                                    onChange={(e) => handleFormChange('restock_info', { ...formData.restock_info!, interval_hours: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 rounded border-2 font-bold text-sm theme-text-primary focus:outline-none theme-bg-card"
                                    style={{ borderColor: 'var(--theme-gradient-2)' }}
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1 pt-1">
                                  <label className="block text-xs font-bold theme-text-secondary">📅 2nd Restock Time (Calculates interval automatically)</label>
                                  <input
                                    type="datetime-local"
                                    step="1"
                                    disabled={!formData.restock_info.next_restock_time}
                                    value={formData.restock_info.second_restock_time || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      let calcInterval = formData.restock_info!.interval_hours;
                                      if (formData.restock_info!.next_restock_time && val) {
                                        const d1 = new Date(formData.restock_info!.next_restock_time).getTime();
                                        const d2 = new Date(val).getTime();
                                        if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
                                          calcInterval = Number(((d2 - d1) / 3600000).toFixed(2));
                                        }
                                      }
                                      handleFormChange('restock_info', { ...formData.restock_info!, second_restock_time: val, interval_hours: calcInterval });
                                    }}
                                    className="w-full px-3 py-2 rounded border-2 font-bold text-sm theme-text-primary focus:outline-none theme-bg-card"
                                    style={{ borderColor: 'var(--theme-gradient-2)' }}
                                  />
                                  {formData.restock_info.interval_hours > 0 && (
                                    <p className="text-xs font-bold theme-text-secondary mt-1">✓ Calculated Interval: <span style={{ color: 'var(--theme-gradient-2)' }}>Every {formData.restock_info.interval_hours} hours</span></p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Next Restock Preview */}
                        <div className="pt-2 border-t theme-border-secondary flex items-center justify-between">
                          <span className="text-xs font-bold theme-text-secondary uppercase tracking-wider">🕐 Next Restock Preview:</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--theme-gradient-2)' }}>
                            {(() => {
                              const now = new Date();
                              if (mode === 'manual') {
                                if (!formData.restock_info.next_restock_time) return '⚠️ Pick 1st manual time';
                                if (!formData.restock_info.interval_hours || formData.restock_info.interval_hours <= 0) return '⚠️ Set recurring hours / 2nd date';
                                const manualDate = new Date(formData.restock_info.next_restock_time);
                                if (isNaN(manualDate.getTime())) return '⚠️ Invalid date';
                                const diff = manualDate.getTime() - now.getTime();
                                if (diff > 0) {
                                  const h = Math.floor(diff / 3600000);
                                  const m = Math.floor((diff % 3600000) / 60000);
                                  const s = Math.floor((diff % 60000) / 1000);
                                  const parts = [];
                                  if (h > 0) parts.push(`${h}h`);
                                  parts.push(`${m}m`);
                                  parts.push(`${s}s`);
                                  return `in ${parts.join(' ')} (Loops every ${formData.restock_info.interval_hours}h)`;
                                } else {
                                  const intervalMs = formData.restock_info.interval_hours * 3600000;
                                  const elapsed = now.getTime() - manualDate.getTime();
                                  const cyclesPassed = Math.floor(elapsed / intervalMs);
                                  const nextRestock = new Date(manualDate.getTime() + (cyclesPassed + 1) * intervalMs);
                                  const nextDiff = nextRestock.getTime() - now.getTime();
                                  const h = Math.floor(nextDiff / 3600000);
                                  const m = Math.floor((nextDiff % 3600000) / 60000);
                                  const s = Math.floor((nextDiff % 60000) / 1000);
                                  const parts = [];
                                  if (h > 0) parts.push(`${h}h`);
                                  parts.push(`${m}m`);
                                  parts.push(`${s}s`);
                                  return `in ${parts.join(' ')} (Loops every ${formData.restock_info.interval_hours}h)`;
                                }
                              }
                              if (!formData.release_date_time || isUnknownSchedule) return '❓ Unknown (no release date)';
                              const release = new Date(formData.release_date_time);
                              const intervalMs = (formData.restock_info.interval_hours || 0) * 3600000;
                              if (intervalMs <= 0) return '⚠️ Enter auto hours';
                              if (release > now) return `After release (every ${formData.restock_info.interval_hours}h)`;
                              const elapsed = now.getTime() - release.getTime();
                              const cyclesPassed = Math.floor(elapsed / intervalMs);
                              const nextRestock = new Date(release.getTime() + (cyclesPassed + 1) * intervalMs);
                              const diff = nextRestock.getTime() - now.getTime();
                              const h = Math.floor(diff / 3600000);
                              const m = Math.floor((diff % 3600000) / 60000);
                              const s = Math.floor((diff % 60000) / 1000);
                              const parts = [];
                              if (h > 0) parts.push(`${h}h`);
                              parts.push(`${m}m`);
                              parts.push(`${s}s`);
                              return `in ${parts.join(' ')}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Game Links (Full Width) */}
                <div className="space-y-1.5 col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🎮 Game Links</label>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(formData.game_links || []).map((link, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-xs font-bold theme-text-secondary w-5 text-center flex-shrink-0">{idx + 1}.</span>
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => updateGameLink(idx, e.target.value)}
                          placeholder="https://www.roblox.com/games/..."
                          className="flex-1 px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary theme-bg-card focus:outline-none min-w-0"
                          style={{ borderColor: 'var(--theme-gradient-2)' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeGameLink(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-base px-2 transition-all hover:scale-110 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Side-by-Side How to Get It & Image Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/* Instructions */}
                <div className="space-y-1.5 flex flex-col">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">How to Get It</label>
                  <textarea
                    value={formData.instruction}
                    onChange={(e) => handleFormChange('instruction', e.target.value)}
                    placeholder="Instructions for obtaining the item..."
                    className="w-full px-3 py-2 rounded-lg border-2 font-bold text-sm md:text-base theme-text-primary theme-bg-card focus:outline-none h-32 resize-y flex-1"
                    style={{ borderColor: 'var(--theme-primary)' }}
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">📷 Item Image</label>
                  <CloudinaryUpload
                    onImageChange={(url) => handleFormChange('image_url', url)}
                    currentImageUrl={formData.image_url}
                  />
                </div>
              </div>

              {/* Screenshots Upload */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold theme-text-secondary uppercase tracking-wider">🖼️ Screenshots</label>
                <div
                  className="p-4 rounded-xl border-2 border-dashed theme-bg-card transition-all cursor-pointer hover:opacity-80 text-center"
                  style={{ borderColor: 'var(--theme-gradient-4)' }}
                  onPaste={handleScreenshotPaste}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files.length > 0) handleScreenshotFiles(e.dataTransfer.files); }}
                  tabIndex={0}
                >
                  <p className="theme-text-secondary font-bold text-xs md:text-sm">📋 Paste from clipboard (Ctrl+V) or drag & drop</p>
                  <label className="mt-2 inline-block px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm cursor-pointer transition-all hover:scale-105 text-white shadow"
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                    {(formData.screenshots || []).map((url, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border-2 theme-bg-card" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                        <img
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-16 object-contain cursor-pointer transition-all hover:scale-105"
                          onClick={() => openImageViewer(url)}
                        />
                        <button
                          type="button"
                          onClick={() => removeScreenshot(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              {formData.item_name && (
                <div className="p-4 rounded-xl border-2 border-dashed space-y-2 theme-bg-card" style={{ borderColor: 'var(--theme-primary)' }}>
                  <p className="text-xs font-bold theme-text-secondary uppercase tracking-wider">Preview</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-16 h-16 object-contain rounded-lg border"
                      style={{ borderColor: 'var(--theme-secondary)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-base theme-text-primary truncate">{formData.item_name}</p>
                      <p className="text-xs font-bold theme-text-secondary truncate">by {formData.creator}</p>
                      <p className="text-xs theme-text-secondary mt-1 opacity-75">{formatLocalDateTime(formData.release_date_time)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleAddSchedule}
                  disabled={isLoading}
                  className="flex-1 gradient-button px-6 py-3 text-base rounded-xl font-black uppercase tracking-wider blocky-shadow-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white text-base rounded-xl font-black uppercase tracking-wider blocky-shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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