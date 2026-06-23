import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button. */
  loading?: boolean;
  /** Icon rendered before the label. */
  leftIcon?: ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: ReactNode;
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean;
  /** Renders a square icon-only button (children treated as the icon). */
  iconOnly?: boolean;
  /** Button `type` attribute. Default: 'button' to avoid accidental form submits. */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Optional field label rendered above the button - matches the label style
   * of Input / Select / DatePicker so the button aligns in a form grid row.
   * Pass a single space (" ") for an invisible height spacer.
   */
  label?: string;
}
