/**
 * Sales History · top-level section for the Release screen.
 *
 * Lets the buyer choose which brand × category row to inspect, then
 * surfaces 5 lenses: Recent 90 days, LY weekly, 3-yr, Occasion lens,
 * Channel mix.
 */

import { useMemo, useState } from 'react';
import { Card, Select, Tabs } from '@/components/primitives';
// import { findBrand, findCategory } from '@/features/otb/mockData/brands'; // ← swapped to API
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { useDemoToday } from '@/hooks/useDemoClock';
import type { BaseCurrency } from '@/features/setup/types';
import { pickHeadlineOccasion } from '../../data/occasions';
import { RecentVelocityTab } from './RecentVelocityTab';
import { LastYearWeeklyTab } from './LastYearWeeklyTab';
import { ThreeYearTab } from './ThreeYearTab';
import { OccasionLensTab } from './OccasionLensTab';
import { ChannelMixTab } from './ChannelMixTab';

interface Props {
  rows: Array<{ row_id: string; brand_uuid: string; category_uuid: string }>;
  periodStartIso: string;
  periodEndIso: string;
  currency: BaseCurrency;
}

export function SalesHistorySection({ rows, periodStartIso, periodEndIso, currency }: Props) {
  const todayMs = useDemoToday();
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.row_id);
  const [activeLens, setActiveLens] = useState('recent');
  const { findBrand, findCategory } = useBrandCategoryLookup();

  const options = useMemo(
    () =>
      rows.map((r) => {
        const brand = findBrand(r.brand_uuid);
        const cat = findCategory(r.category_uuid);
        return {
          value: r.row_id,
          label: `${brand?.name ?? r.brand_uuid} · ${cat?.name ?? r.category_uuid}`,
        };
      }),
    [rows, findBrand, findCategory],
  );

  const selected = useMemo(
    () => rows.find((r) => r.row_id === selectedRowId) ?? rows[0],
    [rows, selectedRowId],
  );

  const headlineOccasion = useMemo(
    () => pickHeadlineOccasion(periodStartIso, periodEndIso),
    [periodStartIso, periodEndIso],
  );

  if (!selected) return null;

  const lensItems = [
    {
      key: 'recent',
      label: 'Recent 90 days',
      content: (
        <div className="pt-3">
          <RecentVelocityTab
            brand_uuid={selected.brand_uuid}
            category_uuid={selected.category_uuid}
            todayMs={todayMs}
            currency={currency}
          />
        </div>
      ),
    },
    {
      key: 'ly-weekly',
      label: 'LY weekly',
      content: (
        <div className="pt-3">
          <LastYearWeeklyTab
            brand_uuid={selected.brand_uuid}
            category_uuid={selected.category_uuid}
            periodStartIso={periodStartIso}
            periodEndIso={periodEndIso}
            currency={currency}
          />
        </div>
      ),
    },
    {
      key: 'three-year',
      label: '3-year',
      content: (
        <div className="pt-3">
          <ThreeYearTab
            brand_uuid={selected.brand_uuid}
            category_uuid={selected.category_uuid}
            periodStartIso={periodStartIso}
            periodEndIso={periodEndIso}
            currency={currency}
          />
        </div>
      ),
    },
    {
      key: 'occasion',
      label: headlineOccasion ? `Occasion · ${headlineOccasion.label}` : 'Occasion',
      content: (
        <div className="pt-3">
          <OccasionLensTab
            brand_uuid={selected.brand_uuid}
            category_uuid={selected.category_uuid}
            periodStartIso={periodStartIso}
            periodEndIso={periodEndIso}
            currency={currency}
          />
        </div>
      ),
    },
    {
      key: 'channel',
      label: 'Channel mix',
      content: (
        <div className="pt-3">
          <ChannelMixTab
            brand_uuid={selected.brand_uuid}
            category_uuid={selected.category_uuid}
            periodStartIso={periodStartIso}
            todayMs={todayMs}
            currency={currency}
          />
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold">Sales history</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Read the demand picture before touching the inventory and buy fields below.
              {headlineOccasion && (
                <>
                  {' '}This period feeds <strong>{headlineOccasion.label}</strong> ({headlineOccasion.start_iso} → {headlineOccasion.end_iso}).
                </>
              )}
            </p>
          </div>
          <div className="w-[280px]">
            <Select<string>
              label="Inspect row"
              value={selectedRowId ?? null}
              onChange={(v) => v && setSelectedRowId(v)}
              options={options}
            />
          </div>
        </div>

        <Tabs items={lensItems} activeKey={activeLens} onChange={setActiveLens} variant="line" />
      </div>
    </Card>
  );
}
