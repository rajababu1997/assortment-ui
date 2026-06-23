import type { ReactNode } from 'react';

export interface AccordionItem {
  key: string;
  header: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple panels open at once. Default: false */
  multiple?: boolean;
  /** Keys of initially open panels. */
  defaultOpenKeys?: string[];
  /** Controlled open keys. */
  openKeys?: string[];
  onChange?: (openKeys: string[]) => void;
  className?: string;
}
