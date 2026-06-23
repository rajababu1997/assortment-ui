import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      /* text-sm is the most-used utility in this app (~350 occurrences). Default
         Tailwind `sm: 0.875rem` compounds to ~12px on a 14px html root. Override
         so `text-sm` renders at 13px (admin-standard small text: captions, table
         meta, badges) without being uncomfortably tiny. */
      fontSize: {
        sm: ['0.9286rem', { lineHeight: '1.4' }],   /* 13px at 14px root */
      },
      colors: {
        /* ─── Primary (theme-aware via CSS vars) ─── */
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          DEFAULT: 'var(--color-primary)',
          contrast: 'var(--color-primary-contrast)',
        },
        neutral: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b',
          900: '#0f172a', DEFAULT: '#1e293b',
        },
        success: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
          600: '#0d9488', 700: '#0f766e', 800: '#115e59',
          900: '#134e4a', DEFAULT: '#0d9488',
        },
        warning: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e',
          900: '#78350f', DEFAULT: '#d97706',
        },
        danger: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca',
          300: '#fca5a5', 400: '#f87171', 500: '#ef4444',
          600: '#dc2626', 700: '#b91c1c', 800: '#991b1b',
          900: '#7f1d1d', DEFAULT: '#dc2626',
        },
        info: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
          300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
          600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af',
          900: '#1e3a5f', DEFAULT: '#3b82f6',
        },
        purple: {
          50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff',
          300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7',
          600: '#9333ea', 700: '#7e22ce', 800: '#6b21a8',
          900: '#581c87', DEFAULT: '#9333ea',
        },
        /* ─── Semantic surface tokens (CSS vars) ─── */
        surface:   { DEFAULT: 'var(--color-surface)', alt: 'var(--color-surface-alt)', raised: 'var(--color-surface-raised)' },
        bg:        { DEFAULT: 'var(--color-bg)' },
        divider:   { DEFAULT: 'var(--color-divider)' },
        border:    { DEFAULT: 'var(--color-border)' },
        'app-bar': { DEFAULT: 'var(--color-app-bar)' },
        overlay:   { DEFAULT: 'var(--color-overlay)' },
        /* ─── Semantic text colors ─── */
        on: {
          DEFAULT:   'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary:  'var(--color-text-tertiary)',
          disabled:  'var(--color-text-disabled)',
        },
        /* ─── Sidebar tokens (CSS vars, always dark) ─── */
        sidebar: {
          DEFAULT:       'var(--sidebar-bg)',
          hover:         'var(--sidebar-bg-hover)',
          text:          'var(--sidebar-text)',
          'text-hover':  'var(--sidebar-text-hover)',
          active:        'var(--sidebar-active-bg)',
          'active-text': 'var(--sidebar-active-text)',
          'active-border': 'var(--sidebar-active-border)',
          group:         'var(--sidebar-group-text)',
          divider:       'var(--sidebar-divider)',
          header:        'var(--sidebar-header-bg)',
          footer:        'var(--sidebar-footer-bg)',
          search:        'var(--sidebar-search-bg)',
          'search-border': 'var(--sidebar-search-border)',
          'tree-line':   'var(--sidebar-tree-line)',
          flyout:        'var(--sidebar-flyout-bg)',
          'flyout-border': 'var(--sidebar-flyout-border)',
        },
      },
      boxShadow: {
        xs:      'var(--shadow-xs)',
        sm:      'var(--shadow-sm)',
        md:      'var(--shadow-md)',
        lg:      'var(--shadow-lg)',
        xl:      'var(--shadow-xl)',
        '2xl':   'var(--shadow-2xl)',
        inner:   'var(--shadow-inner)',
        sidebar: 'var(--shadow-sidebar)',
        topbar:  'var(--shadow-topbar)',
        card:    'var(--shadow-sm)',
        dialog:  'var(--shadow-xl)',
      },
      borderRadius: {
        none:    'var(--radius-none)',
        sm:      'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:      'var(--radius-lg)',
        lg:      'var(--radius-xl)',
        xl:      'var(--radius-2xl)',
        '2xl':   'var(--radius-3xl)',
        full:    'var(--radius-full)',
      },
      fontSize: {
        '2xs':  ['var(--font-size-2xs)', { lineHeight: '1rem' }],
        xs:     ['var(--font-size-xs)',   { lineHeight: '1rem' }],
        sm:     ['var(--font-size-sm)',   { lineHeight: '1.25rem' }],
        base:   ['var(--font-size-base)', { lineHeight: '1.5rem' }],
        md:     ['var(--font-size-md)',   { lineHeight: '1.5rem' }],
        lg:     ['var(--font-size-lg)',   { lineHeight: '1.75rem' }],
        xl:     ['var(--font-size-xl)',   { lineHeight: '1.75rem' }],
        '2xl':  ['var(--font-size-2xl)',  { lineHeight: '2rem' }],
        '3xl':  ['var(--font-size-3xl)',  { lineHeight: '2.25rem' }],
        '4xl':  ['var(--font-size-4xl)',  { lineHeight: '2.5rem' }],
      },
      spacing: {
        header:  'var(--header-height)',
        'sidebar-header': 'var(--sidebar-header-height)',
      },
      height: {
        header:  'var(--header-height)',
        toolbar: 'var(--toolbar-height)',
        footer:  'var(--footer-height)',
        'density-input': 'var(--density-input-height)',
        'density-row':   'var(--density-row-height)',
        'density-btn':   'var(--density-button-height)',
      },
      width: {
        sidebar:             'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed)',
      },
      padding: {
        'density-card': 'var(--density-card-padding)',
        'density-page': 'var(--density-page-padding)',
        'density-btn':  'var(--density-button-px)',
        'density-cell-x': 'var(--density-table-cell-px)',
        'density-cell-y': 'var(--density-table-cell-py)',
      },
      gap: {
        density:  'var(--density-gap)',
        'density-section': 'var(--density-section-gap)',
      },
      transitionDuration: {
        fast:    '150ms',
        normal:  '200ms',
        slow:    '300ms',
        sidebar: '300ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky:   'var(--z-sticky)',
        sidebar:  'var(--z-sidebar)',
        topbar:   'var(--z-topbar)',
        modal:    'var(--z-modal)',
        popover:  'var(--z-popover)',
        tooltip:  'var(--z-tooltip)',
        toast:    'var(--z-toast)',
      },
      opacity: { '12': '0.12', '38': '0.38', '87': '0.87' },
    },
  },
  plugins: [],
} satisfies Config;
