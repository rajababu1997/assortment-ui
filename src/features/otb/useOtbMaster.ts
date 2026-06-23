import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { otbMasterApi } from './otbMasterApi';
import type { Brand, Category } from './types';

const STALE_MS = 5 * 60 * 1000;

export const useApiBrands = () =>
  useQuery({
    queryKey: ['otb', 'brands'],
    queryFn: () => otbMasterApi.brands(),
    staleTime: STALE_MS,
  });

export const useApiCategories = () =>
  useQuery({
    queryKey: ['otb', 'categories'],
    queryFn: () => otbMasterApi.categories(),
    staleTime: STALE_MS,
  });

export const useApiCategoriesByBrand = (brandUuid: string | undefined) =>
  useQuery({
    queryKey: ['otb', 'categories', 'by-brand', brandUuid],
    queryFn: () => otbMasterApi.categoriesByBrand(brandUuid!),
    enabled: !!brandUuid,
    staleTime: STALE_MS,
  });

/**
 * Replacement for the mock `findBrand` / `findCategory` helpers — uses the
 * cached API data via TanStack. Safe to call from any component; all calls
 * share the same query cache (no duplicate requests).
 */
export function useBrandCategoryLookup() {
  const { data: brands = [], isLoading: brandsLoading } = useApiBrands();
  const { data: categories = [], isLoading: categoriesLoading } = useApiCategories();

  const brandByUuid = useMemo(() => {
    const m = new Map<string, Brand>();
    brands.forEach((b) => m.set(b.uuid, b));
    return m;
  }, [brands]);

  const categoryByUuid = useMemo(() => {
    const m = new Map<string, Category>();
    categories.forEach((c) => m.set(c.uuid, c));
    return m;
  }, [categories]);

  const findBrand = useCallback((uuid: string): Brand | undefined => brandByUuid.get(uuid), [brandByUuid]);
  const findCategory = useCallback((uuid: string): Category | undefined => categoryByUuid.get(uuid), [categoryByUuid]);

  /** True until BOTH brand + category lookups have resolved. Pages that
   *  resolve names from these caches gate their spinner on this so the user
   *  never sees a brief "UUID flash" before names appear. */
  const isLoading = brandsLoading || categoriesLoading;

  return { findBrand, findCategory, brands, categories, isLoading };
}
