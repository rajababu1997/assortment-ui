import type { NavigationItem } from '@/types/navigation';

/**
 * Sidebar navigation tree. Each entry can be a leaf (`type: 'basic'`),
 * a collapsable group (`type: 'collapsable'`), or a divider.
 *
 * Add new entries here; `icon` keys come from `NAV_ICONS` in `@/constants/icons`.
 */
export const SIDEBAR_NAV: NavigationItem[] = [
  { id: 'home', title: 'Home', type: 'basic', icon: 'home', link: '/home' },
  { id: 'setup', title: 'OTB Setup', type: 'basic', icon: 'sliders', link: '/setup' },
  { id: 'otb', title: 'OTB Planning', type: 'basic', icon: 'layoutDashboard', link: '/otb' },
  {
    id: 'value',
    title: 'Value Planning',
    type: 'collapsable',
    icon: 'layers',
    children: [
      { id: 'value-plans', title: 'Annual Plans', type: 'basic', link: '/value' },
      { id: 'value-all', title: 'All Value Plans', type: 'basic', link: '/value/all' },
    ],
  },
  { id: 'history', title: 'Sales History', type: 'basic', icon: 'barChart', link: '/history' },
  {
    id: 'examples',
    title: 'Examples',
    type: 'collapsable',
    icon: 'layoutDashboard',
    children: [
      { id: 'sample-list', title: 'Sample CRUD', type: 'basic', link: '/sample' },
    ],
  },
  { id: 'divider-1', title: '', type: 'divider' },
  { id: 'profile', title: 'Profile', type: 'basic', icon: 'user', link: '/user-profile' },
  { id: 'settings', title: 'Settings', type: 'basic', icon: 'settings', link: '/settings' },
];

export function getHomePage(): string {
  return '/home';
}
