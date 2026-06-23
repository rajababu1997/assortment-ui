/**
 * Step 2 / Value-Plan lens. MRP-band and cost-band performance for the
 * comparison window, so the buyer can shape their value-plan splits.
 */

import { useMemo } from 'react';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import { COST_BANDS, MRP_BANDS } from '../mock/dimensions';
import { aggregateByDimension, type HistoryRow } from '../mock/dataset';
import { DimensionTable } from '../components/DimensionTable';
import type { BaseCurrency } from '@/features/setup/types';

interface Props {
  compareRows: HistoryRow[];
  compareLabel: string;
  currency: BaseCurrency;
}

export function MrpCostLens({ compareRows, compareLabel, currency }: Props) {
  const mrpRows = useMemo(() => aggregateByDimension(compareRows, 'mrp'), [compareRows]);
  const costRows = useMemo(() => aggregateByDimension(compareRows, 'cost'), [compareRows]);

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (mrpRows.length > 0) {
      const best = [...mrpRows].sort((a, b) => b.gross_margin_pct - a.gross_margin_pct)[0];
      const worst = [...mrpRows].sort((a, b) => a.sell_through_pct - b.sell_through_pct)[0];
      const bestLabel = MRP_BANDS.find((d) => d.key === best.key)?.label ?? best.key;
      const worstLabel = MRP_BANDS.find((d) => d.key === worst.key)?.label ?? worst.key;
      if (best.gross_margin_pct >= 36) {
        out.push({
          tone: 'positive',
          message: `${bestLabel} delivered ${best.gross_margin_pct.toFixed(1)}% GM. Consider bumping its share by ~5pp in this Value Plan.`,
        });
      }
      if (worst.sell_through_pct < 60) {
        out.push({
          tone: 'warning',
          message: `${worstLabel} cleared only ${worst.sell_through_pct.toFixed(0)}% sell-through. Trim its share or hold flat.`,
        });
      }
    }
    if (costRows.length > 0) {
      const cheapest = [...costRows].sort(
        (a, b) => b.gross_margin_pct - a.gross_margin_pct,
      )[0];
      const label = COST_BANDS.find((d) => d.key === cheapest.key)?.label ?? cheapest.key;
      out.push({
        tone: 'info',
        message: `Best margin came from cost band ${label} (${cheapest.gross_margin_pct.toFixed(1)}%). Brief vendors to keep sourcing in this band.`,
      });
    }
    return out.slice(0, 3);
  }, [mrpRows, costRows]);

  return (
    <div className="flex flex-col gap-4">
      <AiInsightPanel insights={insights} />
      <DimensionTable
        rows={mrpRows}
        taxonomy={MRP_BANDS}
        currency={currency}
        title="MRP band performance"
        subtitle={`Sales weighted across ${compareLabel.toLowerCase()}`}
      />
      <DimensionTable
        rows={costRows}
        taxonomy={COST_BANDS}
        currency={currency}
        title="Cost band performance"
        subtitle="Sourcing band → margin contribution"
      />
    </div>
  );
}
