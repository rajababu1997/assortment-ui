/**
 * Demo sub-type lenses — Color, Print, Size, Vendor, Cluster.
 *
 * Same UI as the real `SubTypeTabsSection`, but the backend doesn't carry
 * these dimensions yet. Each tab uses a hand-tuned distribution that's
 * scaled against the *real* netSalesValue/Units for the current filter —
 * so the totals stay coherent with the rest of the page even though the
 * mix is invented.
 *
 * A "DEMO DATA" pill in the header makes it obvious these aren't backend
 * truth. Replace each MOCK_* dataset with a real `/sales/attribute` call
 * once the backend adds the dimension.
 */

import { useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import { useSalesKpi } from '@/features/sales/useSales';
import { fmtMoneyCompact, fmtPct, fmtUnits } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

type DemoLens = 'color' | 'print' | 'size' | 'vendor' | 'cluster';
const TABS: { key: DemoLens; label: string }[] = [
  { key: 'color',   label: 'Color' },
  { key: 'print',   label: 'Print' },
  { key: 'size',    label: 'Size' },
  { key: 'vendor',  label: 'Vendor' },
  { key: 'cluster', label: 'Cluster' },
];

/** Each entry is a fixed *share* of whatever the period-total is. Sums to 100. */
interface MockSubType {
  key: string;
  /** Display label — may differ from `key` for things like vendor names. */
  label: string;
  /** % share of total netSalesValue. All entries in a lens should sum to ~100. */
  sharePct: number;
  /** % share of total netSalesUnits — may differ from value share when ASPs vary. */
  unitsSharePct: number;
  gpPct: number;
  markdownPct: number;
  strPct: number;
  /** Optional dot colour — used by the Color lens to render a real-life swatch. */
  swatch?: string;
}

// ── Mock datasets ──────────────────────────────────────────────────────────

const MOCK_COLOR: MockSubType[] = [
  { key: 'black',   label: 'Black',       sharePct: 19.0, unitsSharePct: 17.5, gpPct: 56, markdownPct: 11, strPct: 79, swatch: '#0f0f10' },
  { key: 'navy',    label: 'Navy',        sharePct: 14.5, unitsSharePct: 14.0, gpPct: 54, markdownPct: 13, strPct: 75, swatch: '#1e3a8a' },
  { key: 'white',   label: 'White',       sharePct: 11.2, unitsSharePct: 12.8, gpPct: 49, markdownPct: 18, strPct: 71, swatch: '#f5f5f4' },
  { key: 'grey',    label: 'Grey',        sharePct: 10.0, unitsSharePct:  9.8, gpPct: 52, markdownPct: 14, strPct: 72, swatch: '#9ca3af' },
  { key: 'beige',   label: 'Beige / Khaki', sharePct:  9.4, unitsSharePct:  8.9, gpPct: 55, markdownPct: 12, strPct: 73, swatch: '#c8b48a' },
  { key: 'blue',    label: 'Blue',        sharePct:  8.6, unitsSharePct:  9.5, gpPct: 51, markdownPct: 16, strPct: 68, swatch: '#3b82f6' },
  { key: 'red',     label: 'Red',         sharePct:  7.2, unitsSharePct:  6.4, gpPct: 58, markdownPct: 19, strPct: 66, swatch: '#dc2626' },
  { key: 'pink',    label: 'Pink',        sharePct:  6.8, unitsSharePct:  6.1, gpPct: 53, markdownPct: 22, strPct: 61, swatch: '#ec4899' },
  { key: 'green',   label: 'Green',       sharePct:  6.0, unitsSharePct:  6.0, gpPct: 50, markdownPct: 24, strPct: 58, swatch: '#16a34a' },
  { key: 'maroon',  label: 'Maroon',      sharePct:  4.4, unitsSharePct:  4.5, gpPct: 60, markdownPct: 17, strPct: 64, swatch: '#7f1d1d' },
  { key: 'yellow',  label: 'Yellow',      sharePct:  2.9, unitsSharePct:  4.5, gpPct: 47, markdownPct: 31, strPct: 49, swatch: '#eab308' },
];

const MOCK_PRINT: MockSubType[] = [
  { key: 'solid',      label: 'Solid',         sharePct: 58.2, unitsSharePct: 60.0, gpPct: 53, markdownPct: 13, strPct: 76 },
  { key: 'striped',    label: 'Striped',       sharePct: 12.4, unitsSharePct: 11.8, gpPct: 51, markdownPct: 16, strPct: 71 },
  { key: 'checked',    label: 'Checked',       sharePct:  9.1, unitsSharePct:  8.9, gpPct: 56, markdownPct: 15, strPct: 70 },
  { key: 'floral',     label: 'Floral',        sharePct:  7.6, unitsSharePct:  6.5, gpPct: 58, markdownPct: 21, strPct: 63 },
  { key: 'geometric',  label: 'Geometric',     sharePct:  4.8, unitsSharePct:  5.0, gpPct: 50, markdownPct: 24, strPct: 58 },
  { key: 'abstract',   label: 'Abstract',      sharePct:  3.5, unitsSharePct:  3.4, gpPct: 49, markdownPct: 27, strPct: 54 },
  { key: 'embroidered', label: 'Embroidered',  sharePct:  2.8, unitsSharePct:  2.6, gpPct: 62, markdownPct: 14, strPct: 67 },
  { key: 'animal',     label: 'Animal print',  sharePct:  1.6, unitsSharePct:  1.8, gpPct: 47, markdownPct: 33, strPct: 46 },
];

const MOCK_SIZE: MockSubType[] = [
  { key: 'M',   label: 'M',   sharePct: 28.5, unitsSharePct: 28.0, gpPct: 54, markdownPct: 13, strPct: 76 },
  { key: 'L',   label: 'L',   sharePct: 26.8, unitsSharePct: 26.0, gpPct: 54, markdownPct: 14, strPct: 75 },
  { key: 'S',   label: 'S',   sharePct: 19.4, unitsSharePct: 20.5, gpPct: 53, markdownPct: 16, strPct: 70 },
  { key: 'XL',  label: 'XL',  sharePct: 14.2, unitsSharePct: 13.8, gpPct: 55, markdownPct: 14, strPct: 72 },
  { key: 'XS',  label: 'XS',  sharePct:  6.0, unitsSharePct:  6.5, gpPct: 50, markdownPct: 23, strPct: 58 },
  { key: 'XXL', label: 'XXL', sharePct:  5.1, unitsSharePct:  5.2, gpPct: 56, markdownPct: 19, strPct: 63 },
];

const MOCK_VENDOR: MockSubType[] = [
  { key: 'tirupur',     label: 'Tirupur Knit Mills',     sharePct: 22.4, unitsSharePct: 23.1, gpPct: 52, markdownPct: 14, strPct: 74 },
  { key: 'coimbatore',  label: 'Coimbatore Garments',    sharePct: 17.6, unitsSharePct: 17.0, gpPct: 55, markdownPct: 12, strPct: 76 },
  { key: 'ludhiana',    label: 'Ludhiana Knitwear Co',   sharePct: 14.2, unitsSharePct: 13.5, gpPct: 51, markdownPct: 17, strPct: 69 },
  { key: 'mumbai',      label: 'Mumbai Textile Hub',     sharePct: 11.5, unitsSharePct: 11.2, gpPct: 57, markdownPct: 13, strPct: 73 },
  { key: 'surat',       label: 'Surat Synthetic Pvt',    sharePct:  9.8, unitsSharePct: 10.1, gpPct: 48, markdownPct: 22, strPct: 61 },
  { key: 'delhi',       label: 'Delhi Apparel House',    sharePct:  8.6, unitsSharePct:  8.4, gpPct: 53, markdownPct: 18, strPct: 66 },
  { key: 'bangalore',   label: 'Bangalore Garments',     sharePct:  7.5, unitsSharePct:  7.7, gpPct: 50, markdownPct: 20, strPct: 64 },
  { key: 'jaipur',      label: 'Jaipur Block Print Co',  sharePct:  4.6, unitsSharePct:  4.5, gpPct: 61, markdownPct: 16, strPct: 68 },
  { key: 'kolkata',     label: 'Kolkata Weavers Co-op',  sharePct:  3.8, unitsSharePct:  4.5, gpPct: 59, markdownPct: 23, strPct: 57 },
];

const MOCK_CLUSTER: MockSubType[] = [
  { key: 't1-metro',    label: 'Tier-1 Metro',        sharePct: 34.2, unitsSharePct: 28.5, gpPct: 56, markdownPct: 11, strPct: 78 },
  { key: 'premium-mall', label: 'Premium Mall',       sharePct: 21.6, unitsSharePct: 14.8, gpPct: 60, markdownPct: 10, strPct: 81 },
  { key: 'online',      label: 'Online (own + 3P)',   sharePct: 16.8, unitsSharePct: 19.4, gpPct: 49, markdownPct: 21, strPct: 65 },
  { key: 't2-city',     label: 'Tier-2 City',         sharePct: 12.4, unitsSharePct: 16.2, gpPct: 52, markdownPct: 15, strPct: 72 },
  { key: 't3-town',     label: 'Tier-3 Town',         sharePct:  8.1, unitsSharePct: 12.8, gpPct: 48, markdownPct: 19, strPct: 67 },
  { key: 'high-street', label: 'High-Street EBO',     sharePct:  6.9, unitsSharePct:  8.3, gpPct: 54, markdownPct: 14, strPct: 70 },
];

const DATASETS: Record<DemoLens, MockSubType[]> = {
  color: MOCK_COLOR,
  print: MOCK_PRINT,
  size: MOCK_SIZE,
  vendor: MOCK_VENDOR,
  cluster: MOCK_CLUSTER,
};

// ── Component ──────────────────────────────────────────────────────────────

export function MockSubTypeTabsSection({ filters }: { filters: DashboardFilters }) {
  const [tab, setTab] = useState<DemoLens>('color');

  // Use the real period total so mock numbers stay coherent with the rest
  // of the page when the buyer changes filters.
  const { data: kpi, isLoading } = useSalesKpi({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });

  const totalValue = kpi?.netSalesValue ?? 0;
  const totalUnits = kpi?.netSalesUnits ?? 0;

  const rows = useMemo(() => {
    const ds = DATASETS[tab];
    return ds
      .map((d) => ({
        ...d,
        netSalesValue: totalValue * (d.sharePct / 100),
        netSalesUnits: totalUnits * (d.unitsSharePct / 100),
      }))
      .sort((a, b) => b.netSalesValue - a.netSalesValue);
  }, [tab, totalValue, totalUnits]);

  const max = rows[0]?.netSalesValue ?? 0;

  return (
    <section
      className="flex flex-col rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <Palette size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Product attribute performance
          </h3>
          <SectionInfoButton title="Product attribute performance">
            <p>How products perform across five additional lenses — <strong>Color</strong>, <strong>Print</strong>, <strong>Size</strong>, <strong>Vendor</strong>, and <strong>Cluster</strong>.</p>
            <p className="mt-2">Switch tabs to swap between dimensions.</p>
            <p className="mt-3"><strong>Columns:</strong></p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Item name with share bar — visual ranking.</li>
              <li><strong>Net Sales</strong> and <strong>Units</strong>.</li>
              <li><strong>GM%</strong> — Gross Margin.</li>
              <li><strong>MD%</strong> — Markdown depth.</li>
              <li><strong>STR%</strong> — Sell-Through.</li>
            </ul>
            <p className="mt-3">All filters apply. Items are sorted by Net Sales (highest first).</p>
            <p className="mt-3">The Color tab includes a real-life swatch beside each color so the visual breakdown is instantly readable. The Vendor tab shows your supplier mix — useful for negotiating with your top mills.</p>
          </SectionInfoButton>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="rounded-md px-2 py-1 text-[11px] font-medium"
              style={{
                background: tab === t.key ? 'var(--color-primary)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading || totalValue === 0 ? (
        <div
          className="flex h-[200px] items-center justify-center text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {isLoading ? 'Loading totals…' : 'No data to scale demo numbers against.'}
        </div>
      ) : (
        <div className="flex flex-col gap-1 p-3">
          <div
            className="grid grid-cols-[1fr_120px_80px_64px_64px_64px] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <div>{TABS.find((t) => t.key === tab)?.label}</div>
            <div className="text-right">Net Sales</div>
            <div className="text-right">Units</div>
            <div className="text-right">GM%</div>
            <div className="text-right">MD%</div>
            <div className="text-right">STR%</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.key}
              className="grid grid-cols-[1fr_120px_80px_64px_64px_64px] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-surface-alt,#f8fafc)]"
            >
              <div className="flex min-w-0 items-center gap-2">
                {r.swatch && (
                  <span
                    style={{
                      width: 12, height: 12, borderRadius: 3,
                      background: r.swatch,
                      border: '1px solid var(--color-divider)',
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  className="truncate text-[12px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {r.label}
                </div>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-surface-alt, #f1f5f9)', minWidth: 40 }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${max > 0 ? (r.netSalesValue / max) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #60a5fa, #2176ff)',
                    }}
                  />
                </div>
              </div>
              <div className="text-right text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {fmtMoneyCompact(r.netSalesValue)}
              </div>
              <div className="text-right text-[12px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtUnits(r.netSalesUnits)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: '#15803d' }}>
                {fmtPct(r.gpPct)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: '#b91c1c' }}>
                {fmtPct(r.markdownPct)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtPct(r.strPct)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
