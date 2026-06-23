import type { HTMLAttributes, ReactNode } from 'react';

export type CardElevation = 'flat' | 'raised' | 'sunken';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
  /** Optional header area — rendered above the content with a bottom border. */
  header?: ReactNode;
  /** Optional footer area — rendered below content with a top border. */
  footer?: ReactNode;
  /** Remove the default internal padding (useful when embedding a table or image). */
  noPadding?: boolean;
  className?: string;
  children?: ReactNode;
}
