/**
 * Storage status card — shows LocalStorage usage and last backup timestamp.
 */

import { Database } from 'lucide-react';
import { Card } from '@/components/primitives';
import { useStorageStatus } from '../useSetup';

export function StorageStatusCard() {
  const { data, isLoading } = useStorageStatus();

  if (isLoading || !data) {
    return null;
  }

  const usedKb = Math.round(data.usedBytes / 1024);
  const quotaMb = Math.round(data.quotaBytes / 1024 / 1024);
  const pct = Math.min(100, (data.usedBytes / data.quotaBytes) * 100);

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[var(--color-primary)]">
            <Database size={16} strokeWidth={2} />
          </span>
          <h3 className="text-base font-semibold">Storage</h3>
        </div>

        <Row label="LocalStorage usage" value={`${usedKb} KB / ${quotaMb} MB`} />

        <div className="mt-2 mb-3 h-1.5 rounded-full bg-[var(--color-divider)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${pct.toFixed(1)}%` }}
          />
        </div>

        <Row label="Last backup" value={fmtDate(data.lastBackup)} />
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
