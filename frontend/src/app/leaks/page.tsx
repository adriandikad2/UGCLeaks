'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClickableInstructions, NoLinkTemplate } from '../InstructionParser';
import { useTheme } from '../components/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';
import TranslateWidget from '../components/TranslateWidget';
import { hasAccess, isAuthenticated, signout, getUserRole } from '@/lib/auth';
import { ToastContainer, useToast } from '@/app/Toast';
import { updateScheduledItem } from '@/lib/api';

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

type UGCItem = {
  id: string;
  title: string;
  itemName: string;
  creator: string;

  stock: number | 'OUT OF STOCK' | 'unknown' | 'Unknown';
  releaseDateTime: string;
  method: UGCMethod[];
  instruction: string;
  gameLink: string;
  gameLinks?: string[];
  itemLink: string;
  imageUrl: string;
  screenshots?: string[];
  limitPerUser: number;

  soldOut?: boolean; // Manual sold out confirmation by scheduler
  finalCurrentStock?: number; // Persisted current stock when item sold out
  finalTotalStock?: number; // Persisted total stock when item sold out
  ugcCode?: string; // Code for Code Drop items
  codesInfo?: { code: string; uses: number | null }[] | null; // Structured codes with uses
  isAbandoned?: boolean; // Abandoned status
  isPaid?: boolean; // Paid item status (not free)
  isRegular?: boolean; // Regular item status (unlimited/event)
  regionLock?: string | null; // Region lock country code
  restockInfo?: { enabled: boolean; mode?: 'auto' | 'manual'; manual_type?: 'hours' | 'date'; interval_hours: number; restock_amount: number; next_restock_time?: string | null; second_restock_time?: string | null } | null; // Restock info
};

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
  const [viewMode, setViewMode] = useState<'active' | 'upcoming' | 'paid' | 'regular' | 'abandoned'>('upcoming');
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setIsMounted(true);
    setAuthenticated(isAuthenticated());
    setIsEditor(hasAccess('editor'));
    const savedHud = localStorage.getItem('ugc-hud-minimized');
    if (savedHud === 'true') {
      setIsHudMinimized(true);
    }
  }, []);

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Persist HUD minimize state to localStorage when changed
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('ugc-hud-minimized', String(isHudMinimized));
    }
  }, [isHudMinimized, isMounted]);

  const handleSignout = async () => {
    await signout();
    setAuthenticated(false);
    addToast('Signed out successfully', 'success');
    router.push('/');
  };

  // Viewport/Modal States
  const [selectedItem, setSelectedItem] = useState<UGCItem | null>(null);
  const [timers, setTimers] = useState<{ [key: string]: string }>({});
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);

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
          method: Array.isArray(item.method) ? item.method : [item.method || UGCMethod.Unknown],
          instruction: item.instruction,
          gameLink: item.game_link,
          gameLinks: item.game_links,
          itemLink: item.item_link,
          imageUrl: item.image_url,
          screenshots: item.screenshots,
          limitPerUser: item.limit_per_user,
          soldOut: item.sold_out, // Manual sold out confirmation
          finalCurrentStock: item.final_current_stock, // Persisted current stock
          finalTotalStock: item.final_total_stock, // Persisted total stock
          ugcCode: item.ugc_code, // Code if applicable
          codesInfo: item.codes_info, // Structured codes with uses
          isAbandoned: item.is_abandoned, // Abandoned status
          isPaid: item.is_paid, // Paid item status
          isRegular: item.is_regular, // Regular item status
          regionLock: item.region_lock, // Region lock
          restockInfo: item.restock_info, // Restock configuration
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
          
          const parts = [];
          if (days > 0) parts.push(`${days}d`);
          if (hours > 0 || days > 0) parts.push(`${hours}h`);
          parts.push(`${mins}m`);
          parts.push(`${secs}s`);
          newTimers[item.id] = `in ${parts.join(' ')}`;
        } else {
          const elapsed = Math.abs(diff);
          const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
          const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((elapsed % (1000 * 60)) / 1000);
          
          const parts = [];
          if (days > 0) parts.push(`${days}d`);
          if (hours > 0 || days > 0) parts.push(`${hours}h`);
          parts.push(`${mins}m`);
          parts.push(`${secs}s`);
          newTimers[item.id] = `${parts.join(' ')} ago`;
        }
      });
      setTimers(newTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [items, scheduledItems]);



  const filteredItems = [...items, ...scheduledItems]
    .filter(item => {
      const itemIsAbandoned = item.isAbandoned || false;
      const itemIsPaid = item.isPaid || false;
      const itemIsRegular = item.isRegular || false;
      const now = new Date();
      const releaseTime = item.releaseDateTime && !item.releaseDateTime.startsWith('9999')
        ? new Date(item.releaseDateTime)
        : null;
      const isReleased = releaseTime ? releaseTime <= now : false;
      const isUpcoming = releaseTime ? releaseTime > now : true; // Unknown dates count as upcoming

      // View mode filtering
      if (viewMode === 'abandoned' && !itemIsAbandoned) return false;
      if (viewMode === 'paid' && (!itemIsPaid || itemIsAbandoned)) return false;
      if (viewMode === 'regular' && (!itemIsRegular || itemIsAbandoned)) return false;
      if (viewMode === 'active' && (itemIsAbandoned || itemIsPaid || itemIsRegular || !isReleased)) return false;
      if (viewMode === 'upcoming' && (itemIsAbandoned || itemIsPaid || itemIsRegular || !isUpcoming)) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(searchLower) ||
        item.creator.toLowerCase().includes(searchLower) ||
        item.itemName.toLowerCase().includes(searchLower);
      const itemMethods = Array.isArray(item.method) ? item.method : [item.method];
      const matchesMethod = filterMethod === 'All' || itemMethods.includes(filterMethod as any);

      // Release status filter (only applies within current view mode)
      let matchesReleaseStatus = true;
      if (releaseStatusFilter !== 'all' && item.releaseDateTime) {
        if (!item.releaseDateTime.startsWith('9999')) {
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

          {/* Right: Translate & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 relative z-40 scale-90 sm:scale-100 origin-right">
            <TranslateWidget inline />
            <ThemeSwitcher inline />
          </div>
        </div>
      </div>

      {/* --- TOAST NOTIFICATIONS --- */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-[88rem] mx-auto space-y-8">
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
        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          <button
            onClick={() => setViewMode('upcoming')}
            className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'upcoming'
              ? 'text-white shadow-lg scale-105 ring-2 ring-white'
              : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
              }`}
            style={viewMode === 'upcoming' ? { background: 'linear-gradient(to right, var(--theme-gradient-3), var(--theme-gradient-4))' } : {}}
          >
            ⏳ Upcoming
          </button>
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'active'
              ? 'text-white shadow-lg scale-105 ring-2 ring-white'
              : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
              }`}
            style={viewMode === 'active' ? { background: 'linear-gradient(to right, var(--theme-gradient-1), var(--theme-gradient-2))' } : {}}
          >
            🚀 Active Drops
          </button>
          <button
            onClick={() => setViewMode('paid')}
            className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'paid'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105 ring-2 ring-white'
              : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
              }`}
          >
            💰 Paid
          </button>
          <button
            onClick={() => setViewMode('regular')}
            className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'regular'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg scale-105 ring-2 ring-white'
              : 'bg-white/10 theme-on-bg-text hover:bg-white/20'
              }`}
          >
            ♾️ Regular
          </button>
          <button
            onClick={() => setViewMode('abandoned')}
            className={`px-4 md:px-6 py-2 rounded-full font-black text-xs md:text-lg transition-all ${viewMode === 'abandoned'
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
              className="w-full px-4 py-3 rounded-lg border-4 font-bold theme-text-primary focus:outline-none theme-bg-card"
              style={{ borderColor: 'var(--theme-gradient-3)' }}
            >
              <option value="All">All Methods</option>
              {METHOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

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
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`px-4 py-3 rounded-lg border-4 theme-bg-card font-bold theme-text-primary hover:opacity-80 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
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

            // Items with unknown stock (-1) should NEVER show as sold out
            const hasUnknownStock = (
              item.stock === -1 ||
              item.stock === 'unknown' ||
              item.stock === 'Unknown'
            );

            // Item is sold out if: manually marked OR scheduled stock is 0/'OUT OF STOCK'
            // BUT only if stock is not unknown
            const isSoldOut = !hasUnknownStock && (
              item.soldOut ||
              (item.stock === 'OUT OF STOCK')
            );

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

                  <p className="text-center text-xs font-bold theme-text-secondary mb-3">
                    by <span style={{ color: outlineColor }}>{item.creator}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[0] }}
                    >
                      <p className="text-xs font-bold theme-text-secondary uppercase">📦 Stock</p>
                      <p className="font-black text-xs mt-1 truncate" style={{ color: isSoldOut ? 'var(--theme-text-secondary)' : shuffledColors[0] }}>
                        {hasUnknownStock
                          ? '❓ Unknown'
                          : (item.soldOut
                            ? (item.finalCurrentStock != null && item.finalTotalStock != null
                              ? `${item.finalCurrentStock}/${item.finalTotalStock}`
                              : `0/${item.stock || '?'}`)
                            : (typeof item.stock === 'number' ? item.stock : 'OUT'))}
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card flex flex-col justify-center"
                      style={{ borderColor: shuffledColors[1] }}
                    >
                      <p className="text-xs font-bold theme-text-secondary uppercase">🎯 Method</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(item.method) ? item.method : [item.method || UGCMethod.Unknown]).map((m, idx) => {
                          let shortName = 'Unknown';
                          if (m === UGCMethod.WebDrop) shortName = 'Web Drop';
                          else if (m === UGCMethod.InGame || m === UGCMethod.Quest) shortName = 'Quest';
                          else if (m === UGCMethod.CodeDrop) shortName = 'Code Drop';
                          else if (m === UGCMethod.Launcher) shortName = 'Launcher';
                          else if (m === UGCMethod.JoinAndClaim) shortName = 'J&C';
                          else if (m === UGCMethod.TwitchPoints) shortName = 'Twitch';
                          else shortName = m;
                          
                          return (
                            <span key={idx} className="font-black text-[10px] sm:text-xs whitespace-nowrap" style={{ color: shuffledColors[1] }}>
                              {shortName}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[2] }}
                    >
                      <p className="text-xs font-bold theme-text-secondary uppercase">🔢 Limit</p>
                      <p className="font-black text-xs mt-1" style={{ color: shuffledColors[2] }}>
                        {item.limitPerUser}x
                      </p>
                    </div>

                    <div
                      className="p-2 rounded-lg border-2 theme-bg-card"
                      style={{ borderColor: shuffledColors[3] }}
                    >
                      <p className="text-xs font-bold theme-text-secondary uppercase">📅 Release</p>
                      <p className="font-black text-[11px] mt-1 leading-snug break-words" style={{ color: shuffledColors[3] }}>
                        {timers[item.id] === 'Unknown' ? '❓ Unknown' : (timers[item.id] || 'Loading...')}
                      </p>
                      {timers[item.id] && timers[item.id] !== 'Unknown' && item.releaseDateTime && !item.releaseDateTime.startsWith('9999') && (
                        <p className="text-[10px] font-bold theme-text-secondary mt-0.5 leading-tight break-words">
                          {(() => {
                            const d = new Date(item.releaseDateTime);
                            const day = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
                            const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                            return `${day}, ${time}`;
                          })()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Code Display for CodeDrop items */}
                  {(Array.isArray(item.method) ? item.method : [item.method]).includes(UGCMethod.CodeDrop) && (
                    ((Array.isArray(item.codesInfo) && item.codesInfo.length > 0) || item.ugcCode) && (
                      <div
                        className="mb-3 p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center theme-bg-card w-full overflow-hidden"
                        style={{ borderColor: shuffledColors[1] }}
                      >
                        <div className="flex items-center justify-between w-full mb-2 pb-1.5 border-b" style={{ borderColor: `${shuffledColors[1]}40` }}>
                          <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: shuffledColors[1] }}>
                            <span>🔑 Code Drop</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase" style={{ background: shuffledColors[1], color: '#fff' }}>
                            {Array.isArray(item.codesInfo) && item.codesInfo.length > 0 ? `${item.codesInfo.length} ${item.codesInfo.length === 1 ? 'Code' : 'Codes'}` : '1 Code'}
                          </span>
                        </div>

                        <div className="w-full space-y-2">
                          {Array.isArray(item.codesInfo) && item.codesInfo.length > 0 ? (
                            item.codesInfo.map((codeObj, idx) => (
                              <div key={idx} className="flex flex-col items-start gap-1.5 p-2.5 rounded-lg theme-bg-elevated border border-black/10 dark:border-white/10 w-full">
                                <span className="font-mono font-black text-sm sm:text-base tracking-wider select-all break-all w-full text-left" style={{ color: shuffledColors[1] }}>
                                  {codeObj.code}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap self-start" style={{ background: `${shuffledColors[1]}20`, color: shuffledColors[1] }}>
                                  🎟️ {codeObj.uses !== null && typeof codeObj.uses === 'number' ? `${codeObj.uses} Uses` : 'Unlimited Uses'}
                                </span>
                              </div>
                            ))
                          ) : (
                            item.ugcCode ? (
                              <div className="flex flex-col items-start gap-1.5 p-2.5 rounded-lg theme-bg-elevated border border-black/10 dark:border-white/10 w-full">
                                <span className="font-mono font-black text-sm sm:text-base tracking-wider select-all break-all w-full text-left" style={{ color: shuffledColors[1] }}>
                                  {item.ugcCode}
                                </span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap self-start" style={{ background: `${shuffledColors[1]}20`, color: shuffledColors[1] }}>
                                  🎟️ Unlimited Uses
                                </span>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    )
                  )}

                  {/* Region Lock */}
                  {item.regionLock && (
                    <div className="mb-3 p-2 rounded-lg border-2 theme-bg-card flex flex-col items-center justify-center" style={{ borderColor: shuffledColors[2] }}>
                      <p className="text-xs font-bold theme-text-secondary uppercase">🌍 Region Lock</p>
                      <p className="theme-text-primary text-xs font-medium flex items-center gap-1 mt-1">
                        {(() => {
                          const country = COUNTRY_OPTIONS.find(c => c.code === item.regionLock);
                          return country ? `${country.flag} ${country.name}` : `Locked to: ${item.regionLock}`;
                        })()}
                      </p>
                    </div>
                  )}

                  {/* Restock Info */}
                  {item.restockInfo?.enabled && (
                    <div className="mb-3 p-2 rounded-lg border-2 theme-bg-card overflow-hidden break-words" style={{ borderColor: shuffledColors[1] }}>
                      <p className="text-xs font-bold theme-text-secondary uppercase tracking-wider flex items-center justify-between">
                        <span>🔄 Restock</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase" style={{ background: 'var(--theme-gradient-2)', color: '#fff' }}>
                          {item.restockInfo.mode === 'manual' || item.restockInfo.next_restock_time ? 'Manual' : 'Auto'}
                        </span>
                      </p>
                      <p className="font-black text-xs mt-1 leading-tight break-words" style={{ color: shuffledColors[1] }}>
                        Every {item.restockInfo.interval_hours}h · {item.restockInfo.restock_amount} units
                      </p>
                      <p className="text-[10px] font-bold theme-text-secondary mt-0.5 leading-tight break-words">
                        🕐 Next: {(() => {
                          const now = new Date();
                          if (item.restockInfo.mode === 'manual' || item.restockInfo.next_restock_time) {
                            let manualStr = item.restockInfo.next_restock_time!;
                            if (!manualStr.endsWith('Z') && !manualStr.includes('+') && !manualStr.includes('-', 10)) {
                              manualStr = manualStr.replace(' ', 'T') + 'Z';
                            }
                            const manualDate = new Date(manualStr);
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
                              return `in ${parts.join(' ')}`;
                            } else {
                              const intervalMs = (item.restockInfo.interval_hours || 0) * 3600000;
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
                          if (!item.releaseDateTime || item.releaseDateTime.startsWith('9999')) return '❓ Unknown';
                          let dateStr = item.releaseDateTime;
                          if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
                            dateStr = dateStr.replace(' ', 'T') + 'Z';
                          }
                          const release = new Date(dateStr);
                          const intervalMs = item.restockInfo.interval_hours * 3600000;
                          if (intervalMs <= 0) return '⚠️ Invalid';
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
                      </p>
                    </div>
                  )}

                  <div className="mb-3 p-2 theme-bg-card rounded border theme-border-secondary flex-1 relative border-2">
                    <p className="text-xs font-bold theme-text-secondary uppercase mb-1">📖 Info</p>
                    <p className="theme-text-primary text-xs font-medium break-words line-clamp-3 select-text cursor-text">
                      {item.instruction}
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-4" style={{ background: 'linear-gradient(to top, var(--theme-card-bg), transparent)' }}></div>
                  </div>

                  <div className="mt-auto text-center">
                    <span className="text-xs font-bold theme-text-secondary opacity-75 uppercase tracking-widest">Click for Details</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 theme-bg-card rounded-2xl shadow-2xl pop-in border-4" style={{ borderColor: 'var(--theme-primary)' }}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-black theme-text-primary mb-2">No Items Found</h3>
            <p className="theme-text-secondary text-lg font-semibold">Try adjusting your search or filters</p>
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
                <div className="absolute -bottom-12 p-2 theme-bg-card rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105" onClick={() => openImageViewer(selectedItem.imageUrl)}>
                  <img
                    src={selectedItem.imageUrl}
                    className="w-32 h-32 object-contain rounded-lg"
                    alt={selectedItem.title}
                  />
                </div>
              </div>

              <div className="pt-16 pb-8 px-8 text-center space-y-6">
                <div>
                  <h2 className="text-3xl font-black theme-text-primary">{selectedItem.title}</h2>
                  <p className="theme-text-secondary font-bold">by {selectedItem.creator}</p>
                </div>

                {/* Timer Large Display */}
                <div className="theme-bg-card rounded-xl p-4 inline-block border-2" style={{ borderColor: 'var(--theme-primary)' }}>
                  <p className="text-sm font-bold theme-text-secondary uppercase">Status</p>
                  <p className="text-xl font-black" style={{ color: 'var(--theme-gradient-1)' }}>
                    {timers[selectedItem.id] || 'Updating...'}
                  </p>
                </div>

                {/* Code Drop Display in Popup Modal */}
                {(Array.isArray(selectedItem.method) ? selectedItem.method : [selectedItem.method]).includes(UGCMethod.CodeDrop) && (
                  ((Array.isArray(selectedItem.codesInfo) && selectedItem.codesInfo.length > 0) || selectedItem.ugcCode) && (
                    <div className="theme-bg-card border-2 p-6 rounded-xl text-left" style={{ borderColor: 'var(--theme-gradient-1)' }}>
                      <div className="flex items-center justify-between mb-4 pb-2 border-b theme-border-secondary">
                        <h3 className="text-lg font-black theme-text-primary flex items-center gap-2">
                          <span>🔑 Code Drop Secrets & Usages</span>
                        </h3>
                        <span className="text-xs font-black px-3 py-1 rounded-full text-white" style={{ background: 'var(--theme-gradient-1)' }}>
                          {Array.isArray(selectedItem.codesInfo) && selectedItem.codesInfo.length > 0 ? `${selectedItem.codesInfo.length} ${selectedItem.codesInfo.length === 1 ? 'Code' : 'Codes'}` : '1 Code'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {Array.isArray(selectedItem.codesInfo) && selectedItem.codesInfo.length > 0 ? (
                          selectedItem.codesInfo.map((codeObj, idx) => (
                            <div key={idx} className="flex flex-col items-start gap-2 p-3 rounded-xl theme-bg-elevated border border-black/10 dark:border-white/10 w-full">
                              <span className="font-mono font-black text-lg sm:text-xl tracking-wider select-all break-all w-full text-left" style={{ color: 'var(--theme-gradient-1)' }}>
                                {codeObj.code}
                              </span>
                              <span className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap self-start" style={{ background: 'rgba(35, 152, 252, 0.2)', color: 'var(--theme-gradient-1)' }}>
                                🎟️ {codeObj.uses !== null && typeof codeObj.uses === 'number' ? `${codeObj.uses} Uses` : 'Unlimited Uses'}
                              </span>
                            </div>
                          ))
                        ) : (
                          selectedItem.ugcCode ? (
                            <div className="flex flex-col items-start gap-2 p-3 rounded-xl theme-bg-elevated border border-black/10 dark:border-white/10 w-full">
                              <span className="font-mono font-black text-lg sm:text-xl tracking-wider select-all break-all w-full text-left" style={{ color: 'var(--theme-gradient-1)' }}>
                                {selectedItem.ugcCode}
                              </span>
                              <span className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap self-start" style={{ background: 'rgba(35, 152, 252, 0.2)', color: 'var(--theme-gradient-1)' }}>
                                🎟️ Unlimited Uses
                              </span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Full Description / Instruction */}
                <div className="theme-bg-card border-l-8 p-6 rounded-r-xl text-left" style={{ borderColor: 'var(--theme-gradient-2)' }}>
                  <h3 className="text-lg font-black theme-text-primary mb-2">Instructions & Details</h3>
                  <div className="theme-text-secondary font-medium whitespace-pre-wrap leading-relaxed select-text cursor-text">
                    <ClickableInstructions text={selectedItem.instruction} color={'var(--theme-gradient-1)'} />
                  </div>
                </div>

                {/* Screenshots Gallery */}
                {Array.isArray(selectedItem.screenshots) && selectedItem.screenshots.length > 0 && (
                  <div className="theme-bg-card border-2 p-6 rounded-xl text-left" style={{ borderColor: 'var(--theme-gradient-4)' }}>
                    <h3 className="text-lg font-black theme-text-primary mb-4">Screenshots ({selectedItem.screenshots.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedItem.screenshots.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-auto object-contain rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2"
                          style={{ borderColor: 'var(--theme-gradient-4)' }}
                          onClick={() => openImageViewer(url)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Links Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {selectedItem.itemLink && (
                    <Link href={selectedItem.itemLink} target="_blank" className="w-full">
                      <button
                        className="w-full py-4 text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        style={{ background: 'var(--theme-gradient-1)' }}
                      >
                        🛍️ View on Roblox
                      </button>
                    </Link>
                  )}
                  {(() => {
                    const links = Array.isArray(selectedItem.gameLinks) && selectedItem.gameLinks.length > 0
                      ? selectedItem.gameLinks.filter(l => l && l.length > 0)
                      : (selectedItem.gameLink ? [selectedItem.gameLink] : []);
                    if (links.length === 0) return null;
                    if (links.length === 1) {
                      return (
                        <Link href={links[0]} target="_blank" className="w-full">
                          <button
                            className="w-full py-4 text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            style={{ background: 'var(--theme-gradient-2)' }}
                          >
                            🎮 Join Game
                          </button>
                        </Link>
                      );
                    }
                    return links.map((link, idx) => (
                      <Link key={idx} href={link} target="_blank" className="w-full">
                        <button
                          className="w-full py-4 text-white font-black rounded-xl text-xl uppercase shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                          style={{ background: 'var(--theme-gradient-2)' }}
                        >
                          🎮 Join Game {idx + 1}
                        </button>
                      </Link>
                    ));
                  })()}
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

    </div >
  );
}
