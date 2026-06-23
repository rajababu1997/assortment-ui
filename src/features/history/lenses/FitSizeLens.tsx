/**
 * Step 3 / Option-Plan lens. Fit mix + size curve performance. Lets the
 * buyer see which fits and sizes drove revenue last cycle so they can
 * lock the option-plan splits.
 */

import { useMemo } from 'react';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import { FITS, SIZES } from '../mock/dimensions';
import { aggregateByDimension, type HistoryRow } from '../mock/dataset';
import { DimensionTable } from '../components/DimensionTable';
import type { BaseCurrency } from '@/features/setup/types';

interface Props {
  compareRows: HistoryRow[];
  compareLabel: string;
  currency: BaseCurrency;
}

export function FitSizeLens({ compareRows, compareLabel, currency }: Props) {
  const fitRows = useMemo(() => aggregateByDimension(compareRows, 'fit'), [compareRows]);
  const sizeRows = useMemo(() => aggregateByDimension(compareRows, 'size'), [compareRows]);

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (fitRows.length > 0) {
      const top = fitRows[0];
      const label = FITS.find((f) => f.key === top.key)?.label ?? top.key;
      out.push({
        tone: 'positive',
        message: `${label} drove ${top.share_pct.toFixed(0)}% of revenue. Hold or grow its design-slot share.`,
      });
    }
    if (sizeRows.length > 0) {
      const highReturn = [...sizeRows].sort((a, b) => b.returns_pct - a.returns_pct)[0];
      const label = SIZES.find((s) => s.key === highReturn.key)?.label ?? highReturn.key;
      if (highReturn.returns_pct >= 8) {
        out.push({
          tone: 'warning',
          message: `${label} had ${highReturn.returns_pct.toFixed(1)}% returns. Trim that size's share or pull-back from XL-heavy fits.`,
        });
      }
    }
    return out;
  }, [fitRows, sizeRows]);

  return (
    <div className="flex flex-col gap-4">
      <AiInsightPanel insights={insights} />
      <DimensionTable
        rows={fitRows}
        taxonomy={FITS}
        currency={currency}
        title="Fit mix performance"
        subtitle={`Revenue split + health metrics, ${compareLabel.toLowerCase()}`}
      />
      <DimensionTable
        rows={sizeRows}
        taxonomy={SIZES}
        currency={currency}
        title="Size curve performance"
        subtitle="Use this as the input for the option-plan size split"
      />
    </div>
  );
}
