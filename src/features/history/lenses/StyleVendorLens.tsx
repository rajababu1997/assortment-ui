/**
 * Step 4-6 lens. Colors + prints + fabrics + vendors. Designer / vendor-
 * manager / ops can read these to brief design, choose fabric, and pick
 * vendors with strong history.
 */

import { useMemo } from 'react';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import { COLORS, FABRICS, PRINTS, VENDORS } from '../mock/dimensions';
import { aggregateByDimension, type HistoryRow } from '../mock/dataset';
import { DimensionTable } from '../components/DimensionTable';
import type { BaseCurrency } from '@/features/setup/types';

interface Props {
  compareRows: HistoryRow[];
  compareLabel: string;
  currency: BaseCurrency;
}

export function StyleVendorLens({ compareRows, compareLabel, currency }: Props) {
  const colorRows = useMemo(() => aggregateByDimension(compareRows, 'color').slice(0, 10), [compareRows]);
  const printRows = useMemo(() => aggregateByDimension(compareRows, 'print'), [compareRows]);
  const fabricRows = useMemo(() => aggregateByDimension(compareRows, 'fabric'), [compareRows]);
  const vendorRows = useMemo(() => aggregateByDimension(compareRows, 'vendor').slice(0, 6), [compareRows]);

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (colorRows.length > 0) {
      const top = colorRows[0];
      const label = COLORS.find((c) => c.key === top.key)?.label ?? top.key;
      out.push({
        tone: 'positive',
        message: `${label} was the #1 color (ST ${top.sell_through_pct.toFixed(0)}%, GM ${top.gross_margin_pct.toFixed(1)}%). Keep it anchored in this season's palette.`,
      });
    }
    if (fabricRows.length > 0) {
      const bestFabric = [...fabricRows].sort((a, b) => b.gross_margin_pct - a.gross_margin_pct)[0];
      const label = FABRICS.find((f) => f.key === bestFabric.key)?.label ?? bestFabric.key;
      out.push({
        tone: 'info',
        message: `${label} held the best margin (${bestFabric.gross_margin_pct.toFixed(1)}%) with returns at ${bestFabric.returns_pct.toFixed(1)}%. Prefer it when costing allows.`,
      });
    }
    if (vendorRows.length > 0) {
      const top = vendorRows[0];
      const label = VENDORS.find((v) => v.key === top.key)?.label ?? top.key;
      out.push({
        tone: 'info',
        message: `${label} delivered the most revenue with ST ${top.sell_through_pct.toFixed(0)}%. Repeat as primary for this category.`,
      });
    }
    return out.slice(0, 3);
  }, [colorRows, fabricRows, vendorRows]);

  return (
    <div className="flex flex-col gap-4">
      <AiInsightPanel insights={insights} />
      <DimensionTable
        rows={colorRows}
        taxonomy={COLORS}
        currency={currency}
        title="Top 10 colors"
        subtitle={`Ranked by net sales, ${compareLabel.toLowerCase()}`}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DimensionTable
          rows={printRows}
          taxonomy={PRINTS}
          currency={currency}
          title="Prints"
        />
        <DimensionTable
          rows={fabricRows}
          taxonomy={FABRICS}
          currency={currency}
          title="Fabrics"
        />
      </div>
      <DimensionTable
        rows={vendorRows}
        taxonomy={VENDORS}
        currency={currency}
        title="Top vendors"
        subtitle="Revenue contribution + execution health"
      />
    </div>
  );
}
