/**
 * Brand × Category picker — scalable for 100+ brands × 100+ categories.
 *
 * UX:
 *   1. Top searchable multi-select to add brands. Type to filter.
 *   2. Each added brand becomes a compact row with its own searchable
 *      category multi-select. Categories that are unselected stay hidden
 *      so the row only shows what the planner cares about.
 *   3. Per-row "Remove brand" + global "Clear all" for quick reset.
 *
 * Output stays a flat list of `{brand_uuid, category_uuid}` pairs.
 */

import { useEffect, useMemo, useState } from 'react';
import { Layers, Sparkles, Trash2, X } from 'lucide-react';
import { MultiSelect } from '@/components/primitives';
// import { categoriesForBrand, findBrand, SEED_BRANDS } from '../mockData/brands'; // ← swapped to API
import { useApiBrands, useApiCategoriesByBrand } from '../useOtbMaster';

interface SelectedPair {
  brand_uuid: string;
  category_uuid: string;
}

interface Props {
  selected: SelectedPair[];
  onChange: (next: SelectedPair[]) => void;
  disabled?: boolean;
}

// Stable visual swatch per brand-uuid (cycles through a small palette).
const SWATCH_PALETTE = [
  'linear-gradient(135deg, #60a5fa, #38bdf8)',
  'linear-gradient(135deg, #a78bfa, #f472b6)',
  'linear-gradient(135deg, #34d399, #10b981)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
];
function swatchFor(uuid: string): string {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) hash = (hash * 31 + uuid.charCodeAt(i)) >>> 0;
  return SWATCH_PALETTE[hash % SWATCH_PALETTE.length];
}

// const BRAND_OPTIONS = SEED_BRANDS.map((b) => ({ value: b.uuid, label: b.name })); // ← swapped to API

export function BrandCategoryPicker({ selected, onChange, disabled }: Props) {
  // `brandOrder` owns the display sequence of brand rows. Deriving it from
  // `selected` each render caused brands to jump around whenever the pairs
  // array was rebuilt (e.g. dropping a category re-appended that brand). We
  // keep an explicit, stable order so removing/adding categories never
  // shuffles the row above or below.
  const [brandOrder, setBrandOrder] = useState<string[]>(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const p of selected) {
      if (!seen.has(p.brand_uuid)) {
        seen.add(p.brand_uuid);
        order.push(p.brand_uuid);
      }
    }
    return order;
  });

  // Brands the user picked at the top but haven't yet added any category for,
  // OR explicitly cleared all categories from. Keeps the ghost row visible.
  const [extraBrands, setExtraBrands] = useState<string[]>([]);

  // Sync new brands that arrive via `selected` from outside the picker
  // (e.g. Auto-fill dispatches a fresh row set). Append-only — never removes
  // here; explicit `removeBrand` / `clearAll` handle removal.
  useEffect(() => {
    setBrandOrder((prev) => {
      const known = new Set(prev);
      const next = [...prev];
      let changed = false;
      for (const p of selected) {
        if (!known.has(p.brand_uuid)) {
          known.add(p.brand_uuid);
          next.push(p.brand_uuid);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [selected]);

  const { data: brands = [] } = useApiBrands();
  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.uuid, label: b.name })),
    [brands],
  );

  // Display = brands the user is "interested in" right now.
  // Filters out brands that are in `brandOrder` history but no longer in
  // either source — handles parent-driven resets cleanly.
  const selectedBrands = useMemo(() => {
    const inSelected = new Set(selected.map((p) => p.brand_uuid));
    const inExtras = new Set(extraBrands);
    return brandOrder.filter((b) => inSelected.has(b) || inExtras.has(b));
  }, [brandOrder, selected, extraBrands]);

  const handleBrandsChange = (nextBrandUuids: string[]) => {
    if (disabled) return;
    const keep = new Set(nextBrandUuids);
    const fromPairs = new Set(selected.map((p) => p.brand_uuid));
    setExtraBrands(nextBrandUuids.filter((b) => !fromPairs.has(b)));
    // Update brand order: drop deselected, append new ones at end.
    setBrandOrder((prev) => {
      const next: string[] = [];
      for (const b of prev) if (keep.has(b)) next.push(b);
      for (const b of nextBrandUuids) if (!next.includes(b)) next.push(b);
      return next;
    });
    onChange(selected.filter((p) => keep.has(p.brand_uuid)));
  };

  const handleCategoriesChange = (brandUuid: string, nextCatUuids: string[]) => {
    if (disabled) return;
    // Keep the row visible after the user clears its categories.
    if (nextCatUuids.length === 0) {
      setExtraBrands((prev) => (prev.includes(brandUuid) ? prev : [...prev, brandUuid]));
    } else {
      setExtraBrands((prev) => prev.filter((b) => b !== brandUuid));
    }
    // Ensure brand is tracked; never reorder if already present.
    setBrandOrder((prev) => (prev.includes(brandUuid) ? prev : [...prev, brandUuid]));
    // Replace this brand's pairs in place (others untouched).
    const others = selected.filter((p) => p.brand_uuid !== brandUuid);
    const nextForBrand = nextCatUuids.map((cat) => ({ brand_uuid: brandUuid, category_uuid: cat }));
    onChange([...others, ...nextForBrand]);
  };

  const removeBrand = (brandUuid: string) => {
    if (disabled) return;
    setBrandOrder((prev) => prev.filter((b) => b !== brandUuid));
    setExtraBrands((prev) => prev.filter((b) => b !== brandUuid));
    onChange(selected.filter((p) => p.brand_uuid !== brandUuid));
  };

  const clearAll = () => {
    if (disabled) return;
    setBrandOrder([]);
    setExtraBrands([]);
    onChange([]);
  };

  const totalPairs = selected.length;
  const totalBrands = selectedBrands.length;

  return (
    <div className="flex flex-col">
      {/* Attached header strip — matches the OTB Values card header */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{
              background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
              border: '1px solid rgba(96,165,250,0.22)',
              color: 'var(--color-primary)',
            }}
          >
            <Layers size={12} strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Brand × Category
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums uppercase tracking-wider"
            style={{
              background: totalBrands > 0
                ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                : 'color-mix(in srgb, var(--color-text-secondary) 10%, transparent)',
              color: totalBrands > 0 ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            {totalBrands} · {totalPairs}
          </span>
        </div>
        {totalPairs > 0 && !disabled && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-md border bg-[var(--color-surface)] px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
            style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
          >
            <Trash2 size={11} /> Clear
          </button>
        )}
      </div>

      {/* Body — tight padding so content sits close to card border */}
      <div className="flex flex-col gap-2 p-2">
      {/* Brand search-add */}
      {/* When `brandOptions` hasn't loaded yet but we already have selected
          brand UUIDs (re-opening a saved draft), the MultiSelect chips fall
          back to rendering the raw UUID via `String(value)`. Seed temporary
          "Loading…" options keyed on the selected UUIDs so chips stay
          readable until the brand master resolves. */}
      <MultiSelect<string>
        placeholder={`Search brands… (${brands.length} available)`}
        value={selectedBrands}
        onChange={handleBrandsChange}
        options={
          brandOptions.length > 0
            ? brandOptions
            : selectedBrands.map((uuid) => ({ value: uuid, label: 'Loading…' }))
        }
        disabled={disabled}
        searchable
      />

      {/* Per-brand rows */}
      {selectedBrands.length === 0 ? (
        <div
          className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[11px]"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-primary) 22%, var(--color-divider))',
            background: 'color-mix(in srgb, var(--color-primary) 3%, transparent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Sparkles size={11} style={{ color: 'var(--color-primary)' }} />
          Pick brands above to start adding categories.
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          {selectedBrands.map((brandUuid, i) => (
            <BrandRow
              key={brandUuid}
              brandUuid={brandUuid}
              isFirst={i === 0}
              selectedCategoryUuids={selected.filter((p) => p.brand_uuid === brandUuid).map((p) => p.category_uuid)}
              onChange={(cats) => handleCategoriesChange(brandUuid, cats)}
              onRemoveBrand={() => removeBrand(brandUuid)}
              disabled={disabled}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

interface BrandRowProps {
  brandUuid: string;
  isFirst: boolean;
  selectedCategoryUuids: string[];
  onChange: (next: string[]) => void;
  onRemoveBrand: () => void;
  disabled?: boolean;
}

function BrandRow({
  brandUuid,
  isFirst,
  selectedCategoryUuids,
  onChange,
  onRemoveBrand,
  disabled,
}: BrandRowProps) {
  // const brand = findBrand(brandUuid); // ← swapped to API
  // const cats = useMemo(() => categoriesForBrand(brandUuid), [brandUuid]); // ← swapped to API
  const { data: brands = [], isLoading: brandsLoading } = useApiBrands();
  const brand = useMemo(() => brands.find((b) => b.uuid === brandUuid), [brands, brandUuid]);
  const { data: cats = [] } = useApiCategoriesByBrand(brandUuid);
  // Same UUID-flash guard as the brand picker above: while the per-brand
  // category list is loading, fall back to placeholder labels keyed on the
  // selected uuids so chips stay readable.
  const options = useMemo(() => {
    if (cats.length > 0) return cats.map((c) => ({ value: c.uuid, label: c.name }));
    if (selectedCategoryUuids.length > 0) {
      return selectedCategoryUuids.map((uuid) => ({ value: uuid, label: 'Loading…' }));
    }
    return [];
  }, [cats, selectedCategoryUuids]);
  const selectedCount = selectedCategoryUuids.length;
  // While the brand master hasn't resolved yet, the lookup returns undefined.
  // Falling back to the raw UUID makes the card flash a 36-char hash for a
  // few hundred ms — show a neutral placeholder instead until names arrive.
  const brandLabel = brand?.name ?? (brandsLoading ? 'Loading…' : 'Unknown brand');

  return (
    <div
      className="flex flex-col gap-2 px-3 py-2.5 md:flex-row md:items-center"
      style={{
        borderTop: isFirst ? 'none' : '1px solid var(--color-divider)',
        background: selectedCount > 0
          ? 'color-mix(in srgb, var(--color-primary) 4%, var(--color-surface))'
          : 'var(--color-surface)',
      }}
    >
      {/* Brand identity */}
      <div className="flex shrink-0 items-center gap-2 md:min-w-[200px]">
        <span
          className="h-5 w-5 shrink-0 rounded-md"
          style={{ background: swatchFor(brandUuid) }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {brandLabel}
          </p>
          <p className="text-[10px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
            {selectedCount}/{cats.length} categor{cats.length === 1 ? 'y' : 'ies'}
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onRemoveBrand}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
            style={{ color: 'var(--color-text-tertiary)' }}
            title={`Remove ${brand?.name ?? 'brand'}`}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Category multi-select — compact inline */}
      <div className="flex-1 md:min-w-0">
        <MultiSelect<string>
          placeholder={`Search ${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}…`}
          value={selectedCategoryUuids}
          onChange={onChange}
          options={options}
          disabled={disabled}
          searchable
        />
      </div>
    </div>
  );
}
