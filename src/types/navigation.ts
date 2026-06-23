/** Sidebar navigation item shape — supports groups, leaves, dividers. */
export interface NavigationItem {
  id: string;
  title: string;
  type: 'basic' | 'collapsable' | 'group' | 'divider' | 'spacer';
  /** Lucide icon key from `NAV_ICONS` in `src/constants/icons.ts`. */
  icon?: string;
  link?: string;
  externalLink?: boolean;
  target?: '_blank' | '_self';
  exactMatch?: boolean;
  badge?: { title: string; classes?: string };
  children?: NavigationItem[];
  isParent?: boolean;
  hidden?: (_item: NavigationItem) => boolean;
  disabled?: boolean;
  tooltip?: string;
  classes?: { title?: string; icon?: string; wrapper?: string };
}
