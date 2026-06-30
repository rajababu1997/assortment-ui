import type { NavigationItem } from '@/types/navigation';

/**
 * Sidebar navigation tree. Each entry can be a leaf (`type: 'basic'`),
 * a collapsable group (`type: 'collapsable'`), or a divider.
 *
 * Add new entries here; `icon` keys come from `NAV_ICONS` in `@/constants/icons`.
 */
export const SIDEBAR_NAV: NavigationItem[] = [
  { id: 'home', title: 'Home', type: 'basic', icon: 'home', link: '/home' },
  {
    id: 'otb',
    title: 'OTB',
    type: 'collapsable',
    icon: 'layoutDashboard',
    children: [
      { id: 'otb-plans', title: 'OTB Planning', type: 'basic', link: '/otb' },
      { id: 'otb-all', title: 'OTBs List', type: 'basic', link: '/otb/all' },
    ],
  },
  {
    id: 'value',
    title: 'Value Planning',
    type: 'collapsable',
    icon: 'layers',
    children: [
      { id: 'value-plans', title: 'OTB Value Planning', type: 'basic', link: '/value' },
      { id: 'value-all', title: 'OTB Value Plan List', type: 'basic', link: '/value/all' },
    ],
  },
  {
    id: 'option',
    title: 'Option Planning',
    type: 'collapsable',
    icon: 'packageCheck',
    children: [
      { id: 'option-plans', title: 'OTB Option Planning', type: 'basic', link: '/option' },
      { id: 'option-all', title: 'OTB Option Plan List', type: 'basic', link: '/option/all' },
    ],
  },
  
  // {
  //   id: 'examples',
  //   title: 'Examples',
  //   type: 'collapsable',
  //   icon: 'layoutDashboard',
  //   children: [
  //     { id: 'sample-list', title: 'Sample CRUD', type: 'basic', link: '/sample' },
  //   ],
  // },
  { id: 'divider-1', title: '', type: 'divider' },
  { id: 'history', title: 'Sales History', type: 'basic', icon: 'barChart', link: '/history' },
  // { id: 'profile', title: 'Profile', type: 'basic', icon: 'user', link: '/user-profile' },
  // { id: 'settings', title: 'Settings', type: 'basic', icon: 'settings', link: '/settings' },
];

export function getHomePage(): string {
  return '/home';
}
