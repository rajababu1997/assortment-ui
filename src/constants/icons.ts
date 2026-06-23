/**
 * Lucide icon exports for the application.
 *
 * Import icons directly from this file instead of lucide-react for consistency.
 */

import {
  // ── Layout & Home ──
  Home,
  LayoutDashboard,

  // ── Charts & Analytics ──
  BarChart3,
  PieChart,
  Activity,
  BarChart2,
  FileBarChart,
  ChartPie,

  // ── Incidents & Tasks ──
  AlertTriangle,
  Inbox,
  ClipboardList,

  // ── Monitoring ──
  Monitor,
  Radio,
  Video,
  Clock,
  MapPin,
  SmartphoneNfc,

  // ── Drones ──
  Plane,
  Navigation,
  Route,
  Send,
  GitBranch,

  // ── Search & Detection ──
  SearchCheck,
  ScanEye,
  ScanLine,
  ScanSearch,

  // ── Vehicles ──
  Car,
  CarFront,

  // ── Files & Media ──
  FolderArchive,
  Image,
  Aperture,
  Images,
  FileText,

  // ── Crisis & Security ──
  ShieldAlert,
  ShieldCheck,
  Layers,

  // ── Training ──
  GraduationCap,

  // ── Admin ──
  Settings,
  Users,
  User,
  Building2,
  Warehouse,
  Cctv,
  PenSquare,
  Tag,
  Database,
  SlidersHorizontal,
  Map,
  Kanban,
  PackageCheck,

  // ── Notifications ──
  Bell,
  Mail,
  Phone,
  CalendarPlus,
  Calendar,

  // ── Actions ──
  Plus,
  X,
  Check,
  Save,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  RotateCw,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  MoreHorizontal,
  LogIn,
  LogOut,

  // ── UI Elements ──
  Eye,
  EyeOff,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Loader2,
  CircleDot,
  Square,
  Circle,

  // ── Status & Feedback ──
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  HelpCircle,

  // ── Media Controls ──
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,

  // ── Misc ──
  Flame,
  Film,
  HelpCircle as Help,
  History,
  CreditCard,
  Share2,
  Star,
  Heart,
  Flag,
  Bookmark,
  Paperclip,
  Link,
  Slash,
  Menu,
  Grid,
  List,
  Folder,
  FolderOpen,
  Lock,
  Unlock,
  Key,
  Shield,
  Archive,
  Box,
  Package,

  // ── Type export ──
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

// Re-export all icons
export {
  Home, LayoutDashboard, BarChart3, PieChart, Activity, BarChart2, FileBarChart, ChartPie,
  AlertTriangle, Inbox, ClipboardList, Monitor, Radio, Video, Clock, MapPin, SmartphoneNfc,
  Plane, Navigation, Route, Send, GitBranch, SearchCheck, ScanEye, ScanLine, Car, CarFront,
  FolderArchive, Image, Aperture, Images, FileText, ShieldAlert, ShieldCheck, Layers,
  GraduationCap, Settings, Users, User, Building2, Warehouse, Cctv, PenSquare, Tag,
  Database, SlidersHorizontal, Map, Kanban, PackageCheck, Bell, Mail, Phone, CalendarPlus,
  Calendar, Plus, X, Check, Save, Edit, Trash2, Download, Upload, RefreshCw, RotateCw,
  Copy, ExternalLink, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ArrowUpCircle, ArrowDownCircle,
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, MoreVertical, MoreHorizontal, LogIn, LogOut,
  Eye, EyeOff, Search, Filter, SortAsc, SortDesc, Maximize2, Minimize2, ZoomIn, ZoomOut,
  Loader2, CircleDot, Square, Circle, CheckCircle2, XCircle, AlertCircle, Info, HelpCircle,
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Mic, MicOff, Camera, Flame, History,
  CreditCard, Share2, Star, Heart, Flag, Bookmark, Paperclip, Link, Slash, Menu, Grid, List,
  Film, Folder, FolderOpen, Lock, Unlock, Key, Shield, Archive, Box, Package,
  type LucideIcon, type LucideProps,
};

// Re-export NAV_ICONS for navigation
export const NAV_ICONS = {
  home: Home,
  layoutDashboard: LayoutDashboard,
  barChart: BarChart3,
  pieChart: PieChart,
  activity: Activity,
  barChart2: BarChart2,
  fileBarChart: FileBarChart,
  alertTriangle: AlertTriangle,
  inbox: Inbox,
  clipboardList: ClipboardList,
  monitor: Monitor,
  radio: Radio,
  video: Video,
  clock: Clock,
  mapPin: MapPin,
  smartDisplay: SmartphoneNfc,
  plane: Plane,
  navigation: Navigation,
  route: Route,
  drone: Send,
  schema: GitBranch,
  searchCheck: SearchCheck,
  scanEye: ScanEye,
  scanLine: ScanLine,
  scanSearch: ScanSearch,
  car: Car,
  carFront: CarFront,
  folderArchive: FolderArchive,
  image: Image,
  aperture: Aperture,
  shieldAlert: ShieldAlert,
  shieldCheck: ShieldCheck,
  layers: Layers,
  graduationCap: GraduationCap,
  settings: Settings,
  users: Users,
  user: User,
  building: Building2,
  warehouse: Warehouse,
  cctv: Cctv,
  penSquare: PenSquare,
  tag: Tag,
  database: Database,
  slidersH: SlidersHorizontal,
  map: Map,
  kanban: Kanban,
  packageCheck: PackageCheck,
  bell: Bell,
  mail: Mail,
  phone: Phone,
  calendarPlus: CalendarPlus,
  calendar: Calendar,
  flame: Flame,
  film: Film,
  shield: Shield,
  sliders: SlidersHorizontal,
  helpCircle: HelpCircle,
  chartPie: ChartPie,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;
