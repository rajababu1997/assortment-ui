import { Button } from '@/components/primitives';
import type { LucideIcon } from '@/constants/icons';
import type { ReactNode } from 'react';

export interface TpsPrimaryButtonProps {
  label?: string;
  children?: ReactNode;
  /** Lucide icon component e.g. Plus, Save — rendered as left icon. */
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function TpsPrimaryButton({
  label,
  children,
  icon: Icon,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
}: TpsPrimaryButtonProps) {
  const leftIcon = Icon
    ? <Icon size={14} strokeWidth={2.5} aria-hidden />
    : undefined;

  return (
    <Button
      variant="primary"
      type={type}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      leftIcon={leftIcon}
      className={className}
    >
      {label ?? children}
    </Button>
  );
}
