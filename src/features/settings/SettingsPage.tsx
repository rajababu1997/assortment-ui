import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setDark, setDensity } from '@/store/slices/themeSlice';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { isDark, density } = useAppSelector((s) => s.theme);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-lg border border-border bg-surface p-6 shadow-sm space-y-4">
        <h2 className="text-base font-medium">Appearance</h2>
        <label className="flex items-center justify-between">
          <span className="text-sm">Dark mode</span>
          <input
            type="checkbox"
            checked={isDark}
            onChange={(e) => dispatch(setDark(e.target.checked))}
            className="h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between">
          <span className="text-sm">Density</span>
          <select
            value={density}
            onChange={(e) => dispatch(setDensity(e.target.value as 'comfortable' | 'compact'))}
            className="rounded border border-border bg-bg px-2 py-1 text-sm"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
      </section>
    </div>
  );
}
