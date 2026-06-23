import { useCallback, useMemo, useState } from 'react';
import { Plus, Sparkles, Users, Activity, Database, TrendingUp, Sliders, Save } from 'lucide-react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tag, Dialog } from '@/components/primitives';
import { TpsPrimaryButton, TpsSecondaryButton } from '@/components/ui';
import { TpsDataTable } from '@/components/tps-data-table';
import type { ColumnConfig, ActionConfig, ToolbarActionConfig } from '@/components/tps-data-table';
import { ICON, ICON_BUTTON_SEVERITY } from '@/components/tps-data-table';
import { TABLE_ACTION_TYPES } from '@/constants/enums';
import { TpsForm, useTpsFormFactory } from '@/components/tps-form';
import type { FormSchema } from '@/components/tps-form';

// ── Dummy table data ──────────────────────────────────────────────────────────

interface SampleRow {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Pending' | 'In-Progress' | 'Completed';
  joined: string;
  records: number;
}

const ROWS: SampleRow[] = [
  { id: 1, name: 'Alice Walker', email: 'alice@example.com', role: 'Admin',  status: 'Completed',   joined: '2025-01-12', records: 42 },
  { id: 2, name: 'Bob Chen',     email: 'bob@example.com',   role: 'Editor', status: 'In-Progress', joined: '2025-02-04', records: 18 },
  { id: 3, name: 'Carla Diaz',   email: 'carla@example.com', role: 'Viewer', status: 'Pending',     joined: '2025-03-18', records: 5 },
  { id: 4, name: 'David Park',   email: 'david@example.com', role: 'Editor', status: 'Completed',   joined: '2024-11-30', records: 76 },
  { id: 5, name: 'Eve Liu',      email: 'eve@example.com',   role: 'Admin',  status: 'In-Progress', joined: '2025-04-22', records: 33 },
  { id: 6, name: 'Frank Ortiz',  email: 'frank@example.com', role: 'Viewer', status: 'Pending',     joined: '2025-05-09', records: 2 },
  { id: 7, name: 'Grace Kim',    email: 'grace@example.com', role: 'Editor', status: 'Completed',   joined: '2025-06-15', records: 51 },
];

const STATUS_CHIP_OPTIONS = [
  { label: 'Pending',     value: 'Pending',     color: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', activeBg: '#E2E8F0', activeText: '#1E293B', activeBorder: '#475569' } },
  { label: 'In-Progress', value: 'In-Progress', color: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', activeBg: '#FDE68A', activeText: '#78350F', activeBorder: '#D97706' } },
  { label: 'Completed',   value: 'Completed',   color: { bg: '#DCFCE7', text: '#14532D', border: '#86EFAC', activeBg: '#BBF7D0', activeText: '#14532D', activeBorder: '#16A34A' } },
];

const STATUS_SEVERITY: Record<SampleRow['status'], 'secondary' | 'warning' | 'success'> = {
  Pending: 'secondary',
  'In-Progress': 'warning',
  Completed: 'success',
};

const COLUMNS: ColumnConfig<SampleRow>[] = [
  { field: 'joined',  header: 'Joined',   sortable: true, filterVariant: 'text', minWidth: 130 },
  { field: 'name',    header: 'Name',     sortable: true, filterVariant: 'text', cardRole: 'title', cardVisible: true },
  { field: 'email',   header: 'Email',    sortable: true, filterVariant: 'text' },
  { field: 'role',    header: 'Role',     sortable: true, filterVariant: 'set',
    render: (_v, row) => <Tag label={row.role} severity={row.role === 'Admin' ? 'info' : row.role === 'Editor' ? 'success' : 'secondary'} /> },
  { field: 'records', header: 'Records',  sortable: true, filterVariant: 'number', align: 'right', cardVisible: true },
  { field: 'status',  header: 'Status',   sortable: true,
    render: (_v, row) => <Tag label={row.status} severity={STATUS_SEVERITY[row.status]} />, cardVisible: true },
];

// ── Stats grid data ───────────────────────────────────────────────────────────

const STATS = [
  { label: 'Active Users', value: '1,284', delta: '+12.5%', icon: Users,       tone: 'primary' as const },
  { label: 'API Calls',    value: '38.2K', delta: '+4.1%',  icon: Activity,    tone: 'success' as const },
  { label: 'Records',      value: '12,948', delta: '+187',  icon: Database,    tone: 'info' as const },
  { label: 'Conversion',   value: '8.4%',  delta: '+0.7pp', icon: TrendingUp,  tone: 'warning' as const },
];

const TONE_BG: Record<'primary' | 'success' | 'info' | 'warning', string> = {
  primary: 'linear-gradient(135deg, rgba(33,118,255,0.15), rgba(110,141,240,0.15))',
  success: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.15))',
  info:    'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(125,211,252,0.15))',
  warning: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.15))',
};
const TONE_FG: Record<'primary' | 'success' | 'info' | 'warning', string> = {
  primary: '#2176FF', success: '#10b981', info: '#0ea5e9', warning: '#f59e0b',
};

// ── Demo form schema (every field type) ───────────────────────────────────────

const DEMO_FORM_SCHEMA: FormSchema = {
  // ── Section: Text inputs ──
  username: {
    type: 'text', label: 'Username', placeholder: 'Enter your username',
    rules: { required: true, minLength: 3, maxLength: 32 },
    section: 'Text inputs', sectionIcon: Sparkles, sectionColor: 'primary',
    sectionDescription: 'Plain text, email, password, search, textarea, number.',
  },
  email: {
    type: 'text', inputType: 'email', label: 'Email', placeholder: 'name@example.com',
    rules: { required: true, pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$' }, section: 'Text inputs',
  },
  password: {
    type: 'password', label: 'Password', placeholder: 'Min 8 characters',
    rules: { required: true, minLength: 8 }, section: 'Text inputs',
  },
  search: {
    type: 'text-search', label: 'Search', placeholder: 'Search something…', section: 'Text inputs',
  },
  bio: {
    type: 'textarea', label: 'Bio', placeholder: 'Tell us about yourself…',
    rules: { maxLength: 500 }, rows: 4, section: 'Text inputs', colSpan: 2,
  },
  age: {
    type: 'number', label: 'Age', placeholder: '0', rules: { required: true, min: 0, max: 120 },
    section: 'Text inputs',
  },

  // ── Section: Selection inputs ──
  country: {
    type: 'single-select', label: 'Country',
    placeholder: 'Pick a country',
    options: [
      { label: 'India', value: 'IN' },
      { label: 'United States', value: 'US' },
      { label: 'United Kingdom', value: 'UK' },
      { label: 'Germany', value: 'DE' },
      { label: 'Japan', value: 'JP' },
    ],
    rules: { required: true },
    section: 'Selection', sectionIcon: Sliders, sectionColor: 'info',
    sectionDescription: 'Single + multi select, radio, checkbox.',
  },
  skills: {
    type: 'multi-select', label: 'Skills',
    placeholder: 'Pick all that apply',
    options: [
      { label: 'TypeScript', value: 'ts' },
      { label: 'React', value: 'react' },
      { label: 'Node', value: 'node' },
      { label: 'Python', value: 'py' },
      { label: 'Go', value: 'go' },
    ],
    section: 'Selection',
  },
  gender: {
    type: 'radio', label: 'Gender',
    options: [
      { label: 'Male', value: 'm' },
      { label: 'Female', value: 'f' },
      { label: 'Other', value: 'o' },
    ],
    section: 'Selection',
  },
  acceptTos: {
    type: 'checkbox', label: 'I accept the terms', rules: { required: true }, section: 'Selection',
  },

  // ── Section: Date & time ──
  birthday: {
    type: 'date', label: 'Birthday',
    section: 'Date & time', sectionIcon: Sliders, sectionColor: 'purple',
    sectionDescription: 'Date pickers (with and without time).',
  },
  meetingAt: {
    type: 'date', label: 'Meeting at', showTime: true, section: 'Date & time',
  },

  // ── Section: Toggles ──
  notify: {
    type: 'toggle-switch', label: 'Email notifications', value: true,
    section: 'Toggles', sectionIcon: Sliders, sectionColor: 'success',
    sectionDescription: 'Toggle switch, toggle button, selected button.',
  },
  isActive: {
    type: 'toggle-button', label: 'Active', value: true, section: 'Toggles',
  },
  plan: {
    type: 'selected-button', label: 'Plan',
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
      { label: 'Enterprise', value: 'ent' },
    ],
    value: 'pro', section: 'Toggles',
  },

  // ── Section: Numeric range ──
  volume: {
    type: 'slider', label: 'Volume', value: 50, rules: { min: 0, max: 100 },
    section: 'Numeric range', sectionIcon: Sliders, sectionColor: 'warning',
    sectionDescription: 'Slider + segmented control.',
  },
  size: {
    type: 'segmented-control', label: 'Size',
    options: [
      { label: 'Small', value: 'sm' },
      { label: 'Medium', value: 'md' },
      { label: 'Large', value: 'lg' },
    ],
    value: 'md', section: 'Numeric range',
  },
};

// ── Demo form inside dialog ────────────────────────────────────────────────────

function DemoForm({ onSubmit, onCancel }: { onSubmit: (data: unknown) => void; onCancel: () => void }) {
  const { form, fields, toPayload } = useTpsFormFactory(DEMO_FORM_SCHEMA, { mode: 'create' });

  return (
    <form
      onSubmit={form.handleSubmit(() => onSubmit(toPayload()))}
      className="flex h-full flex-col"
    >
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        <TpsForm form={form} fields={fields} mode="create" columns={2} />
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-surface px-1 pt-4">
        <TpsSecondaryButton label="Cancel" onClick={onCancel} />
        <TpsPrimaryButton label="Save" icon={Save} type="submit" />
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const user = useAppSelector((s) => s.auth.user);

  const [data, setData] = useState<SampleRow[]>(ROWS);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const filteredData = useMemo(() => {
    if (!appliedStatuses.length) return data;
    return data.filter((row) => appliedStatuses.includes(row.status));
  }, [data, appliedStatuses]);

  const instantChipSlots = useMemo(
    () => [
      {
        type: 'chips' as const,
        field: 'status',
        label: 'Status',
        multi: true,
        options: STATUS_CHIP_OPTIONS,
        showCount: true,
        getCount: (tableData: SampleRow[], value: string) =>
          tableData.filter((row) => row.status === value).length,
      },
    ],
    []
  );

  const handleFilterChange = useCallback((values: Record<string, unknown>) => {
    setAppliedStatuses((values.status as string[]) ?? []);
  }, []);

  const actions = useMemo<ActionConfig<SampleRow>[]>(
    () => [
      { type: TABLE_ACTION_TYPES.VIEW,   icon: ICON.PI_EYE,    label: 'View',
        severity: ICON_BUTTON_SEVERITY.SECONDARY as ActionConfig['severity'] },
      { type: TABLE_ACTION_TYPES.EDIT,   icon: ICON.PI_PENCIL, label: 'Edit',
        severity: ICON_BUTTON_SEVERITY.INFO as ActionConfig['severity'] },
      { type: TABLE_ACTION_TYPES.DELETE, icon: ICON.PI_TRASH,  label: 'Delete',
        severity: ICON_BUTTON_SEVERITY.DANGER as ActionConfig['severity'],
        confirmMessage: 'Are you sure you want to delete this row?' },
    ],
    []
  );

  const headerActions = useMemo<ToolbarActionConfig[]>(
    () => [
      {
        label: 'Open form with all fields',
        icon: Plus,
        primary: true,
        show: true,
        command: () => setFormOpen(true),
      },
    ],
    []
  );

  const handleAction = useCallback(
    (type: string, row: SampleRow) => {
      if (type === TABLE_ACTION_TYPES.DELETE) {
        setData((prev) => prev.filter((r) => r.id !== row.id));
      } else {
        alert(`${type} on ${row.name}`);
      }
    },
    []
  );

  const handleRefresh = useCallback(() => {
    setData(ROWS);
    setAppliedStatuses([]);
  }, []);

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <PageHeader
        icon={Sparkles}
        title={`Welcome${user?.firstName ? `, ${user.firstName}` : user?.userName ? `, ${user.userName}` : ''}`}
        subtitle="Boilerplate dashboard — sample table + form demo."
      />

      {/* ── Stats grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, delta, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-on-secondary">{label}</p>
                <p className="mt-2 text-2xl font-bold text-on">{value}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-[var(--color-success-50)] px-2 py-0.5 text-xs font-semibold text-[var(--color-success-700)]">
                  {delta}
                </span>
              </div>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: TONE_BG[tone] }}
              >
                <Icon size={20} style={{ color: TONE_FG[tone] }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Data table ─────────────────────────────────────────────────────── */}
      <TpsDataTable<SampleRow>
        header="Users"
        headerIcon="users"
        headerDescription="Create and manage users in your tenant."
        data={filteredData}
        columns={COLUMNS}
        actions={actions}
        onAction={handleAction}
        onRefresh={handleRefresh}
        rowIdField="id"
        tableKey="dt-home-sample"
        showColumnToggle
        height="55vh"
        headerActions={headerActions}
        filterLayout="split"
        filterInstantSlots={instantChipSlots}
        filterTableData={data}
        onFilterChange={handleFilterChange}
      />

      {/* ── All-fields form dialog ─────────────────────────────────────────── */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="All field types"
        description="Demo form using every TpsForm field type — text, number, password, textarea, single/multi select, radio, checkbox, date, toggle switch/button, slider, selected button, segmented control, text search."
        size="lg"
        closeOnBackdrop={false}
      >
        <DemoForm
          onCancel={() => setFormOpen(false)}
          onSubmit={(payload) => {
            console.log('Form payload', payload);
            alert(JSON.stringify(payload, null, 2));
            setFormOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}
