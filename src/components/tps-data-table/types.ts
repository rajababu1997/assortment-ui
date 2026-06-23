/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { FieldSchema } from '@/components/tps-form/tpsFormInterfaceTypes';
import { LUCIDE_ICON } from '@/constants/lucideIcons';

// ── Select Option ───────────────────────────────────────────────────────────
export interface SelectOption {
  label: string;
  value: any;
}

// ── Column Config ───────────────────────────────────────────────────────────
// Defines a single column in the DataTable
export interface ColumnConfig<T = any> {
  field: keyof T | string;
  header: string;
  sortable?: boolean; // default: true
  /** AG Grid column filter variant — omit to disable column filter.
   *  'dropdown' renders a PrimeReact Dropdown as the floating filter (mirrors Angular CustomHeaderFilterDropdownComponent). */
  filterVariant?: 'text' | 'number' | 'date' | 'set' | 'dropdown';
  /** Options for filterVariant 'dropdown' or 'set' */
  filterOptions?: { label: string; value: any }[];
  render?: (_value: any, _row: T) => ReactNode; // custom cell renderer
  width?: number;
  minWidth?: number; // default: 100
  maxWidth?: number;
  frozen?: 'left' | 'right'; // pinned column
  /** Completely hide this column (e.g., partner-conditional) — mirrors Angular ColDef.hide */
  hide?: boolean;
  /** Hide this column below the given breakpoint */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  /** Exclude from CSV/Excel export (default: true = exportable) */
  exportable?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Show a copy-to-clipboard icon in the cell (appears on row hover).
   *  - `true`           → copies the formatted display value
   *  - function         → copies whatever string the function returns */
  copyable?: boolean | ((_row: T, _value: any) => string);
  /** Format display value — also used for global search + export */
  valueFormatter?: (_value: any, _row: T) => string;
  /** Show on mobile card face */
  cardVisible?: boolean;
  /** Position on mobile card */
  cardRole?: 'title' | 'subtitle' | 'badge' | 'meta';
}

// ── Action Config ───────────────────────────────────────────────────────────
// Defines a single row action button
export interface ActionConfig<T = any> {
  type: string;
  /** Icon: Lucide component */
  icon: LucideIcon;
  label: string; // tooltip on desktop, button label on mobile
  severity?: 'info' | 'success' | 'warning' | 'danger' | 'secondary' | 'help';
  /** Return false to hide this action for a given row */
  visible?: (_row: T) => boolean;
  disabled?: (_row: T) => boolean;
  /** Show PrimeReact confirmation dialog before firing onAction */
  confirmMessage?: string;
}

// ── Toolbar Action Config ───────────────────────────────────────────────────
// Mirrors Angular buttonActions[] + toolbarActions[] in tps-table:
//   primary=true   → filled blue button (tps-primary-button) in header row
//   secondary=true → outlined blue button (tps-secondary-button) in header row
//   neither        → icon-only button in the action bar (toolBarActions)
export interface ToolbarActionConfig {
  /** Display name — mirrors Angular buttonActions.name / toolbarActions.name */
  label: string;
  /** Icon: Lucide component */
  icon?: LucideIcon;
  /** SVG asset name — mirrors Angular toolbarActions.svgIcon (renders assets/svg/<svgIcon>.svg) */
  svgIcon?: string;
  /** Whether the icon is an SVG asset — mirrors Angular buttonActions.isSvg */
  isSvg?: boolean;
  command: () => void;
  /** Filled blue button — shown in header row right side (mirrors Angular primary) */
  primary?: boolean;
  /** Outlined blue button — shown in header row right side (mirrors Angular secondary) */
  secondary?: boolean;
  /** Danger/warning/info tint — only applies to primary/secondary buttons */
  severity?: 'info' | 'success' | 'warning' | 'danger' | 'secondary' | 'help';
  /** Hide this action (ACL gate) — default: true (visible). Mirrors Angular show */
  show?: boolean;
}

// ── Date Preset ──────────────────────────────────────────────────────────────
export interface DatePreset {
  label: string;
  value: string;
  getRange: () => { from: Date; to: Date };
}

export const DEFAULT_DATE_PRESETS: DatePreset[] = [
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    },
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      y.setHours(0, 0, 0, 0);
      const end = new Date(y);
      end.setHours(23, 59, 59, 999);
      return { from: y, to: end };
    },
  },
  {
    label: '7 Days',
    value: '7d',
    getRange: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    },
  },
  {
    label: '30 Days',
    value: '30d',
    getRange: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    },
  },
  {
    label: 'Custom',
    value: 'custom',
    getRange: () => ({ from: new Date(), to: new Date() }),
  },
];

// ── Date Preset Config ───────────────────────────────────────────────────────
export interface DatePresetConfig {
  presets?: DatePreset[];
  fromField: string;
  toField: string;
  autoSubmit?: boolean;
  defaultPreset?: string;
}

// ── Filter Field Config (drawer) ─────────────────────────────────────────────
// Reuses FieldSchema from Step 8 TpsForm — maps to filter drawer fields only
export type FilterFieldConfig = {
  field: string;
  label: string;
  required?: boolean;
} & Pick<
  FieldSchema,
  'type' | 'options' | 'placeholder' | 'value' | 'rules' | 'show' | 'minDate' | 'maxDate' | 'showTime'
>;

// ── Filter Slot Types (Row 2 Toolbar) ────────────────────────────────────────
// Config-driven, slot-based filter system. Parent decides which filters render.
// Each slot maps to a specific filter UI control.

export type FilterSlotType = 'chips' | 'singleSelect' | 'multiSelect' | 'search' | 'dateRange' | 'tags';

/** Optional per-option color config for filter chips */
export interface ChipOptionColor {
  /** Background when chip is inactive */
  bg: string;
  /** Text color when chip is inactive */
  text: string;
  /** Border color when chip is inactive */
  border?: string;
  /** Background when chip is active/selected */
  activeBg: string;
  /** Text color when chip is active/selected */
  activeText: string;
  /** Border color when chip is active/selected */
  activeBorder: string;
}

export interface ChipOption {
  label: string;
  value: any;
  /** Optional color override — when provided, overrides CSS module chip styles */
  color?: ChipOptionColor;
}

// Shared base for all slots except dateRange (which has fromField/toField instead)
interface FilterSlotBase {
  /** Slot type — determines which control is rendered */
  type: FilterSlotType;
  /** Field key used in the values object */
  field: string;
  /** Label shown above or inside the control */
  label?: string;
  /** Placeholder text (for select/search) */
  placeholder?: string;
  /** Set false to hide this slot — enables partner/role conditional rendering */
  show?: boolean;
}

/** Segmented pill filter — radio-style (single) or multi-select pills */
export interface FilterSlotChips extends FilterSlotBase {
  type: 'chips';
  options: ChipOption[];
  /** Allow multiple selection — default: false (single, radio-like) */
  multi?: boolean;
  defaultValue?: any;
  /** Show live count next to chip label (e.g., "Critical • 12") — 2026 design */
  showCount?: boolean;
  /** Function to calculate count for this chip from table data */
  getCount?: (_data: any[], _value: any) => number;
}

/** Single value dropdown selector */
export interface FilterSlotSingleSelect extends FilterSlotBase {
  type: 'singleSelect';
  options: SelectOption[];
  /** Show × clear button when active — default: true */
  clearable?: boolean;
  defaultValue?: any;
}

/** Multi-value dropdown selector */
export interface FilterSlotMultiSelect extends FilterSlotBase {
  type: 'multiSelect';
  options: SelectOption[];
  /** Max labels to show inline before "+N more" — default: 1 */
  maxVisible?: number;
  defaultValue?: any[];
}

/** Inline text search input */
export interface FilterSlotSearch extends FilterSlotBase {
  type: 'search';
  defaultValue?: string;
}

/** Date range picker with optional presets — uses two separate field keys */
export interface FilterSlotDateRange {
  type: 'dateRange';
  /** Field key for the "from" date in the values object */
  fromField: string;
  /** Field key for the "to" date in the values object */
  toField: string;
  /** Display label on the trigger button */
  label?: string;
  /** Show/hide this slot — default: true */
  show?: boolean;
  /** Quick date presets (Today, Yesterday, 7 Days, 30 Days, Custom) */
  presets?: DatePreset[];
  /** Show time picker alongside date input — default: false */
  showTime?: boolean;
  defaultValue?: { from: Date | null; to: Date | null };
  /** Render From/To date inputs inline in the toolbar instead of inside a popover */
  inline?: boolean;
  /** Labels for the inline From/To inputs — default: 'From' / 'To' */
  fromLabel?: string;
  toLabel?: string;
}

/** Toggleable tag pills — like chips but visually tag-style with × on active */
export interface FilterSlotTags extends FilterSlotBase {
  type: 'tags';
  options: SelectOption[];
  defaultValue?: any[];
}

export type FilterSlotConfig =
  | FilterSlotChips
  | FilterSlotSingleSelect
  | FilterSlotMultiSelect
  | FilterSlotSearch
  | FilterSlotDateRange
  | FilterSlotTags;

// ── DataTable Props ─────────────────────────────────────────────────────────
export interface DataTableProps<T extends object = any> {
  /** Field used as unique row ID — default: 'id' */
  rowIdField?: keyof T;

  // Data
  data: T[];
  loading?: boolean;

  // Columns & Actions
  columns: ColumnConfig<T>[];
  actions?: ActionConfig<T>[];
  onAction?: (_type: string, _row: T) => void;

  // ── Header / Layout (mirrors Angular @Input() names) ───────────────────
  /** Table title — mirrors Angular tableHeader */
  header?: string;
  /** Subtitle shown below header — for context/description */
  headerSubtitle?: string;
  /** Icon: Lucide component (preferred) or legacy PrimeIcon string for the header icon pill */
  headerIcon?: LucideIcon | string;
  /** Short description shown below the header title */
  headerDescription?: string;
  /** Show/hide the entire header row (title + button actions) — mirrors Angular showTableHeader, default: true */
  showTableHeader?: boolean;
  /** Show back arrow icon left of title — mirrors Angular showBackIcon, default: false */
  showBackIcon?: boolean;
  /** Callback when back icon is clicked — mirrors Angular @Output() onClick */
  onBack?: () => void;
  /** Tooltip text shown on a ⓘ icon next to the title — mirrors Angular headerTooltip */
  headerTooltip?: string;
  /** Arbitrary content rendered between header row and filter bar — mirrors Angular metaData */
  metaData?: ReactNode;
  /** Height of the grid area — default: '500px' */
  height?: string;

  // Mobile
  mobileLayout?: 'card' | 'stack'; // default: 'card'

  // ── Column Filters (mirrors Angular @Input() names) ────────────────────
  /** Enable AG Grid column header filters — mirrors Angular enableColumnFilters, default: false */
  enableColumnFilters?: boolean;
  /** Show floating filters below column headers — mirrors Angular enableFloatingFilters, default: false */
  enableFloatingFilters?: boolean;
  /** Always show column header filter icon (vs on-hover) — mirrors Angular showHeaderFilterIconAlways, default: false */
  showHeaderFilterIconAlways?: boolean;

  // ── Toolbar ────────────────────────────────────────────────────────────
  /** Show/hide the (N) row count next to header title — mirrors Angular showNoOfRows, default: true */
  showRowCount?: boolean;
  showSearch?: boolean; // default: true
  showExport?: boolean; // default: true
  exportFilename?: string;
  showColumnToggle?: boolean; // default: true
  showRefresh?: boolean; // default: true
  /** Callback on refresh click — mirrors Angular @Output() onRefresh */
  onRefresh?: () => void;
  /** Primary/secondary buttons shown in header row (right of title) — mirrors Angular buttonActions[] */
  headerActions?: ToolbarActionConfig[];
  /** Icon-only items shown in the action bar (left of export/refresh) — mirrors Angular toolBarActions[] */
  toolbarActions?: ToolbarActionConfig[];

  // ── Filter drawer (mirrors Angular quickFilterFormFields pattern) ───────
  filters?: FilterFieldConfig[];

  // ── Pagination ─────────────────────────────────────────────────────────
  pageSizes?: number[]; // default: [10, 15, 20, 50]
  defaultPageSize?: number; // default: 15

  // ── Selection (mirrors Angular rowSelection + @Output() onSelectionChange) ──
  selectable?: boolean;
  /** Row selection mode — default: 'single' (matches Angular) */
  selectionMode?: 'single' | 'multiple';
  /** Callback when row selection changes — mirrors Angular @Output() onSelectionChange */
  onSelectionChange?: (_rows: T[]) => void;

  // ── Misc ───────────────────────────────────────────────────────────────
  /** localStorage key for column visibility prefs */
  tableKey?: string;
  /** @deprecated Use entityName/entityNamePlural instead */
  emptyMessage?: string;

  // ── Empty state ─────────────────────────────────────────────────────────
  /** Pass an error object to show the error empty state */
  error?: Error | null;
  /** Callback to add first item — shows "Add" CTA on the no-data empty state */
  onAdd?: () => void;
  /** Singular entity name shown in empty state e.g. "Camera" */
  entityName?: string;
  /** Plural entity name e.g. "Cameras" — defaults to entityName + "s" */
  entityNamePlural?: string;
  /** Description shown in the no-data empty state */
  emptyDescription?: string;
  // ── Row 2 Inline Filter Toolbar ───────────────────────────────────────
  /** Slot-based filter config for the Row 2 filter toolbar (replaces headerFilters) */
  filterSlots?: FilterSlotConfig[];
  /** Called on every slot value change — receives the full values map */
  onFilterChange?: (_values: Record<string, any>) => void;

  // ── 2026 Split Layout Filter Props ─────────────────────────────────────
  /** Layout mode: 'single-row' (default) or 'split' (2026 design) */
  filterLayout?: 'single-row' | 'split';
  /** Table data for chip count calculation (2026 split layout) */
  filterTableData?: T[];
  /** Staged filters (left side) — require Apply button (2026 split layout) */
  filterStagedSlots?: FilterSlotConfig[];
  /** Instant filters (right side) — apply immediately (2026 split layout) */
  filterInstantSlots?: FilterSlotChips[];
  /** Show Apply button for staged filters (2026 split layout) */
  filterShowApplyButton?: boolean;
  /** Apply button label — default: 'Apply Filters' */
  filterApplyButtonLabel?: string;
  /** Called when Apply button is clicked — receives current filter values */
  onFilterApply?: (_values: Record<string, any>) => void;
  /** Pulse animation on Apply button when filters change (2026 split layout) */
  filterHasUnappliedChanges?: boolean;
}

// ── DataTable State ─────────────────────────────────────────────────────────
export interface DataTableState {
  searchText: string;
  filterDrawerOpen: boolean;
  drawerFilters: Record<string, any>;
  activeColumnFilters: Record<string, any>;
}

// ── Action Cell Context ─────────────────────────────────────────────────────
// Passed via AG Grid context to ActionsCellRenderer
export interface ActionCellContext<T = any> {
  actions: ActionConfig<T>[];
  onAction: (_type: string, _row: T) => void;
}

// ── Breakpoints ─────────────────────────────────────────────────────────────
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';
export const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// ── AG_FILTER_TYPE ──────────────────────────────────────────────────────────
// AG Grid filterType string constants — used in filter model comparisons.
// AG Grid does not export these, so we define them here.
export const AG_FILTER_TYPE = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SET: 'set',
} as const;

// ── TABLE_ACTION_TYPES ──────────────────────────────────────────────────────
// Mirror of Angular TABLE_ACTION_TYPES — used as action.type values
// Mirror of Angular TABLE_ACTION_TYPES enum (tps-enum-constants.ts) — all values included
export const TABLE_ACTION_TYPES = {
  CREATE: 'CREATE',
  VIEW: 'VIEW',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  APPROVE: 'APPROVE',
  ANALYTICS: 'ANALYTICS',
  PIN_DROP: 'PIN_DROP',
  DOWNLOAD: 'DOWNLOAD',
  DUPLICATE: 'DUPLICATE',
} as const;

// ── ICON ────────────────────────────────────────────────────────────────────
// Lucide icon component constants for action icons
// Migrated from PrimeIcons to Lucide React icons
export const ICON = {
  PI_EYE: LUCIDE_ICON.EYE,
  PI_PENCIL: LUCIDE_ICON.PENCIL,
  PI_TRASH: LUCIDE_ICON.TRASH,
  PI_POWER_OFF: LUCIDE_ICON.POWER_OFF,
  PI_CHECK: LUCIDE_ICON.CHECK,
  PI_DOWNLOAD: LUCIDE_ICON.DOWNLOAD,
  PI_COPY: LUCIDE_ICON.COPY,
  PI_CHART_BAR: LUCIDE_ICON.CHART_BAR,
  PI_HEART: LUCIDE_ICON.HEART,
  PI_SEARCH: LUCIDE_ICON.SEARCH,
  PI_INFO_CIRCLE: LUCIDE_ICON.INFO_CIRCLE,
  PI_UPLOAD: LUCIDE_ICON.UPLOAD,
  PI_COG: LUCIDE_ICON.COG,
  PI_IMAGE: LUCIDE_ICON.IMAGE,
  PI_MAP_MARKER: LUCIDE_ICON.MAP_MARKER,
  PI_USERS: LUCIDE_ICON.USERS,
} as const;

// ── ICON_BUTTON_SEVERITY ────────────────────────────────────────────────────
export const ICON_BUTTON_SEVERITY = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  SECONDARY: 'secondary',
  HELP: 'help',
} as const;
