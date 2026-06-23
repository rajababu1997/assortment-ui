/**
 * Lucide Icons - Complete icon library for the application
 * Replaces PrimeIcons with Lucide React icons
 * All icons exported as Lucide components with standardized naming
 */

import {
  // Common Actions
  Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Save, Download, Upload, Copy,
  ExternalLink, RefreshCw, Search, Filter, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, MoreVertical, MoreHorizontal, Settings, Maximize2, Minimize2,

  // Navigation & Layout
  Home, LayoutDashboard, Menu, Grid, List, Table, Columns, Layers, Map, MapPin,
  Navigation, Route, ArrowLeft, ArrowRight, ArrowUp, ArrowDown,

  // Users & People
  User, Users, UserPlus, UserMinus, UserCheck, UserX, IdCard, Shield, ShieldCheck,
  ShieldAlert, ShieldX,

  // Communication
  Mail, Inbox, Send, Phone, MessageSquare, MessageCircle, Bell, BellOff, BellRing,

  // Files & Media
  File, FileText, FilePlus, FileMinus, FileEdit, FileImage, Folder, FolderOpen,
  FolderPlus, Image, Images, Camera, Video, Mic, Play, Pause, Square, Circle,

  // Charts & Analytics
  BarChart, BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  Activity, ChartPie, FileBarChart,

  // Calendar & Time
  Calendar, CalendarPlus, Clock, History, Timer,

  // Buildings & Places
  Building, Building2, Warehouse, Home as HomeBuilding, MapPinned, Globe,

  // Vehicles & Transport
  Car, CarFront, Truck, Plane, Navigation as NavigationIcon,

  // Technology & Devices
  Monitor, Radio, Tv, Smartphone, SmartphoneNfc, Wifi, WifiOff, Database,
  Server, Cpu, HardDrive, Cctv,

  // Status & Indicators
  CheckCircle, CheckCircle2, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle,
  Zap, ZapOff, Power, PowerOff,

  // Objects & Items
  Tag, Tags, Box, Package, PackageCheck, Boxes, Archive, ShoppingCart, ShoppingBag,
  Gift, Star, Heart, Flag, Bookmark,

  // UI Elements
  Sun, Moon, Contrast, Palette, Droplet, Sliders, SlidersHorizontal, ToggleLeft,
  ToggleRight, Lock, Unlock, Key, Fingerprint,

  // Editing & Creation
  Edit, Edit2, Edit3, PenSquare, Scissors, Clipboard, ClipboardList, ClipboardCheck,

  // Social & Sharing
  Share, Share2, Link, Link2, ExternalLink as ExternalLinkIcon,

  // Directional
  ChevronsLeft, ChevronsRight, ChevronsUp, ChevronsDown, MoveHorizontal, MoveVertical,

  // Misc
  Code, Terminal, GitBranch, Flame, Aperture, GraduationCap, Briefcase,
  Wrench, Hammer, Lightbulb, Target, Crosshair, ScanEye, SearchCheck,
  Kanban, LayoutGrid, Receipt, Network, Shapes, Component,

  type LucideIcon,
} from 'lucide-react';

// ── Icon Constants (replaces ICON from icons.ts) ────────────────────────────

export const LUCIDE_ICON = {
  // Home & Dashboard
  HOME: Home,
  CHART_PIE: ChartPie,
  CHART_BAR: BarChart,
  CHART_SCATTER: LineChart,
  DESKTOP: Monitor,

  // Communication
  ENVELOPE: Mail,
  VIDEO: Video,
  MAP_MARKER: MapPin,

  // Users
  USERS: Users,
  USER: User,
  USER_EDIT: UserCheck,

  // Settings & Config
  COG: Settings,
  CAMERA: Camera,

  // Buildings
  BUILDING: Building,
  BUILDING_COLUMNS: Building2,

  // Actions
  PEN_TO_SQUARE: PenSquare,
  BELL: Bell,
  PHONE: Phone,
  CALENDAR_PLUS: CalendarPlus,
  CALENDAR: Calendar,
  SLIDERS_H: SlidersHorizontal,

  // Media & Files
  ANDROID: Smartphone,
  FOLDER_OPEN: FolderOpen,
  SEARCH: Search,
  HISTORY: History,
  ID_CARD: IdCard,
  INBOX: Inbox,
  IMAGES: Images,
  IMAGE: Image,
  SHARE_ALT: Share2,
  INFO_CIRCLE: Info,
  TAG: Tag,
  CAR: Car,
  DATABASE: Database,
  BARS: Menu,
  MAP: Map,
  SUN: Sun,
  RECEIPT: Receipt,
  SITEMAP: Network,

  // Common Actions (AG Grid / Table)
  PLUS: Plus,
  PENCIL: Pencil,
  TRASH: Trash2,
  EYE: Eye,
  DOWNLOAD: Download,
  UPLOAD: Upload,
  REFRESH: RefreshCw,
  FILTER: Filter,
  COPY: Copy,
  EXTERNAL_LINK: ExternalLink,
  CHECK: Check,
  X_MARK: X,
  SAVE: Save,

  // Chevrons
  CHEVRON_DOWN: ChevronDown,
  CHEVRON_UP: ChevronUp,
  CHEVRON_LEFT: ChevronLeft,
  CHEVRON_RIGHT: ChevronRight,

  // More
  MORE_VERTICAL: MoreVertical,
  MORE_HORIZONTAL: MoreHorizontal,

  // Grid & Layout
  GRID: Grid,
  LIST: List,
  TABLE: Table,
  COLUMNS: Columns,
  TH_LARGE: LayoutGrid,

  // Status
  CHECK_CIRCLE: CheckCircle2,
  X_CIRCLE: XCircle,
  ALERT_TRIANGLE: AlertTriangle,
  ALERT_CIRCLE: AlertCircle,

  // Files
  FILE: File,
  FILE_TEXT: FileText,
  FILE_PLUS: FilePlus,
  FOLDER: Folder,

  // Others
  SETTINGS: Settings,
  LOCK: Lock,
  UNLOCK: Unlock,
  STAR: Star,
  HEART: Heart,
  FLAG: Flag,
  BOOKMARK: Bookmark,
  LINK: Link,
  CODE: Code,
  TERMINAL: Terminal,
  GIFT: Gift,
  BOX: Box,
  PACKAGE: Package,
  ARCHIVE: Archive,
  BRIEFCASE: Briefcase,
  WRENCH: Wrench,
  HAMMER: Hammer,
  LIGHTBULB: Lightbulb,
  TARGET: Target,
  FLAME: Flame,
  KANBAN: Kanban,
  GRADUATION_CAP: GraduationCap,
  SHIELD: Shield,
  PLAY: Play,
  PAUSE: Pause,
  POWER: Power,
  POWER_OFF: PowerOff,
  MAXIMIZE: Maximize2,
  MINIMIZE: Minimize2,
  MOON: Moon,
  PALETTE: Palette,
  DROPLET: Droplet,
  SLIDERS: Sliders,
  KEY: Key,
  FINGERPRINT: Fingerprint,
  EDIT: Edit,
  SCISSORS: Scissors,
  CLIPBOARD: Clipboard,
  CLIPBOARD_LIST: ClipboardList,
  SHAPES: Shapes,
  COMPONENT: Component,
} as const;

// ── Icon Name Type ──────────────────────────────────────────────────────────

export type LucideIconName = keyof typeof LUCIDE_ICON;

// ── Icon Helper Function ────────────────────────────────────────────────────

/**
 * Get a Lucide icon component by name
 * @param iconName - The icon name from LUCIDE_ICON
 * @returns The Lucide icon component
 */
export function getLucideIcon(iconName: LucideIconName): LucideIcon {
  return LUCIDE_ICON[iconName];
}

// ── Re-export commonly used icons ───────────────────────────────────────────

export {
  Plus, Pencil, Trash2, Eye, EyeOff, X, Check, Save, Download, Upload, Copy,
  ExternalLink, RefreshCw, Search, Filter, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, MoreVertical, MoreHorizontal, Settings,
  Home, LayoutDashboard, Menu, Grid, List, Table, Map, MapPin,
  User, Users, UserPlus, Mail, Inbox, Send, Phone, Bell,
  File, FileText, Folder, FolderOpen, Image, Images, Camera, Video,
  BarChart, BarChart2, BarChart3, LineChart, PieChart, Activity,
  Calendar, CalendarPlus, Clock, History,
  Building, Building2, Warehouse, Car, Monitor, Database,
  CheckCircle2, XCircle, AlertCircle, AlertTriangle, Info,
  Tag, Tags, Sun, Moon, SlidersHorizontal,
  type LucideIcon,
};

// ── Backward Compatibility (for gradual migration) ─────────────────────────

/** @deprecated Use LUCIDE_ICON instead */
export const ICON = {
  PI_HOME: 'HOME',
  PI_CHART_PIE: 'CHART_PIE',
  PI_CHART_BAR: 'CHART_BAR',
  PI_CHART_SCATTER: 'CHART_SCATTER',
  PI_DESKTOP: 'DESKTOP',
  PI_ENVELOPE: 'ENVELOPE',
  PI_VIDEO: 'VIDEO',
  PI_MAP_MARKER: 'MAP_MARKER',
  PI_USERS: 'USERS',
  PI_USER: 'USER',
  PI_USER_EDIT: 'USER_EDIT',
  PI_COG: 'COG',
  PI_CAMERA: 'CAMERA',
  PI_BUILDING: 'BUILDING',
  PI_BUILDING_COLUMNS: 'BUILDING_COLUMNS',
  PI_PEN_TO_SQUARE: 'PEN_TO_SQUARE',
  PI_BELL: 'BELL',
  PI_PHONE: 'PHONE',
  PI_CALENDAR_PLUS: 'CALENDAR_PLUS',
  PI_CALENDAR: 'CALENDAR',
  PI_SLIDERS_H: 'SLIDERS_H',
  PI_ANDROID: 'ANDROID',
  PI_FOLDER_OPEN: 'FOLDER_OPEN',
  PI_SEARCH: 'SEARCH',
  PI_HISTORY: 'HISTORY',
  PI_ID_CARD: 'ID_CARD',
  PI_INBOX: 'INBOX',
  PI_IMAGES: 'IMAGES',
  PI_IMAGE: 'IMAGE',
  PI_SHARE_ALT: 'SHARE_ALT',
  PI_INFO_CIRCLE: 'INFO_CIRCLE',
  PI_TAG: 'TAG',
  PI_CAR: 'CAR',
  PI_DATABASE: 'DATABASE',
  PI_BARS: 'BARS',
  PI_MAP: 'MAP',
  PI_SUN: 'SUN',
  PI_RECEIPT: 'RECEIPT',
  PI_SITEMAP: 'SITEMAP',
  PI_EYE: 'EYE',
  PI_PENCIL: 'PENCIL',
  PI_TRASH: 'TRASH',
} as const;
