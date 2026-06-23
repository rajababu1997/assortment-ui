/**
 * NavIcon — renders a Lucide icon by key for sidebar/topbar navigation.
 *
 * Looks up the icon key in NAV_ICONS map and renders the Lucide component.
 * Falls back to null if no matching icon is found.
 */
import { NAV_ICONS } from '@/constants/icons';

interface NavIconProps {
  /** Lucide icon key from NAV_ICONS map (e.g. 'layoutDashboard', 'monitor') */
  icon?: string;
  /** Additional CSS class names */
  className?: string;
  /** Icon size in px (default 18) */
  size?: number;
}

export function NavIcon({ icon, className = '', size = 18 }: NavIconProps) {
  if (!icon) return null;

  const LucideIcon = NAV_ICONS[icon];
  if (!LucideIcon) return null;

  return (
    <LucideIcon
      className={className}
      size={size}
      strokeWidth={1.5}
    />
  );
}
