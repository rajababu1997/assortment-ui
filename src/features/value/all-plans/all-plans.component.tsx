/**
 * All Value Plans page — `/value/all`. Thin wrapper that mounts the
 * reusable `AllValuePlansTable` with page-level chrome (back arrow +
 * row-open navigation) and a default ~60-day date range (last month's
 * first day → current month's last day). The same table is also embedded
 * in the editor's "View all" dialog.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoToday } from '@/hooks/useDemoClock';
import { AllValuePlansTable } from './AllValuePlansTable';

export default function ValueAllPlansPage() {
  const navigate = useNavigate();
  const todayMs = useDemoToday();

  // Default range: first day of LAST month → last day of THIS month.
  // ≈60 days. Recomputed only when the demo clock changes.
  const defaultDateRange = useMemo(() => {
    const today = new Date(todayMs);
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from, to };
  }, [todayMs]);

  return (
    <div className="flex h-full w-full flex-col p-1">
      <AllValuePlansTable
        showBackIcon
        onBack={() => navigate('/value')}
        onOpenRow={(planId, otbCode) => navigate(`/value/${planId}/${otbCode}`)}
        defaultDateRange={defaultDateRange}
      />
    </div>
  );
}
