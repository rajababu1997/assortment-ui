/**
 * Trend Intelligence — mounted at `/trends`. Single-page trend cockpit
 * for a merchandiser: 8 headline KPIs, 8 AI insights derived from real
 * sales data, and a set of drill-down cards across category / fabric /
 * fit / composition / color / size. No filters — full-tenant view.
 *
 * See individual components for section-specific docs.
 */

import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useTrendData } from './useTrendData';
import { buildInsights } from './utils/aiInsights';
import { KpiStrip } from './components/KpiStrip';
import { AiInsightsStrip } from './components/AiInsightsStrip';
import { SalesTrendChart } from './components/SalesTrendChart';
import { FabricTypeCard } from './components/FabricTypeCard';
import { FitPerformanceCard } from './components/FitPerformanceCard';
import { CategoryPerformanceTable } from './components/CategoryPerformanceTable';
import { ColorPerformanceTable } from './components/ColorPerformanceTable';
import { CompositionPerformanceCard } from './components/CompositionPerformanceCard';
import { SizePerformanceCard } from './components/SizePerformanceCard';

export default function TrendIntelligencePage() {
  const data = useTrendData();
  const insights = useMemo(() => buildInsights(data), [data]);

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        <Header />

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {/* <KpiStrip ty={data.ty} ly={data.ly} isLoading={data.isLoading} /> */}

          <AiInsightsStrip insights={insights} isLoading={data.isLoading} />

          {/* Trend chart spans full width so 12 months read comfortably. */}
          {/* <SalesTrendChart
            ty={data.monthly}
            ly={data.monthlyLy}
            isLoading={data.isLoading}
          /> */}

          {/* Attribute rollups pair up so each card gets ~50% width. */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <FabricTypeCard rows={data.fabricTypes} isLoading={data.isLoading} />
            <FitPerformanceCard rows={data.fits} isLoading={data.isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <CategoryPerformanceTable rows={data.categories} isLoading={data.isLoading} />
            <CompositionPerformanceCard rows={data.compositions} isLoading={data.isLoading} />
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <ColorPerformanceTable />
            <SizePerformanceCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: 'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(167,139,250,0.20))',
          border: '1px solid rgba(96,165,250,0.25)',
          color: 'var(--color-primary)',
        }}
      >
        <Sparkles size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <h1
          className="text-base font-semibold leading-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Trend Intelligence
        </h1>
        <p
          className="mt-0.5 text-xs"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Last 12 months vs prior 12 months · full tenant · AI-generated recommendations
        </p>
      </div>
    </div>
  );
}
