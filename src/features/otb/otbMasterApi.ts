import { invokeService } from '@/services/invokeService';
import { API_CONFIG } from '@/constants/apiConfig';
import type { Brand, Category, MrpBand } from './types';

// ── Backend wire shapes (camelCase, with Domain audit columns) ──────────────
// Only the fields we actually read are typed.

interface BrandWire {
  uuid: string;
  code: string;
  name: string;
}

interface BandWire {
  uuid: string;
  bandId: 'entry' | 'core' | 'upper' | 'statement';
  label: string;
  mrpMin: number;
  mrpMax: number | null;
  costMin: number;
  costMax: number;
  sortOrder: number;
}

interface CategoryWire {
  uuid: string;
  brandUuid: string;
  code: string;
  name: string;
  bands?: BandWire[];
}

// ── Mappers (wire → frontend types) ─────────────────────────────────────────

const toBrand = (w: BrandWire): Brand => ({
  uuid: w.uuid,
  code: w.code,
  name: w.name,
});

const toBand = (w: BandWire): MrpBand => ({
  id: w.bandId,
  label: w.label,
  mrp_min: w.mrpMin,
  mrp_max: w.mrpMax,
  cost_min: w.costMin,
  cost_max: w.costMax,
});

const toCategory = (w: CategoryWire): Category => ({
  uuid: w.uuid,
  brand_uuid: w.brandUuid,
  code: w.code,
  name: w.name,
  bands: (w.bands ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map(toBand),
});

// ── Public API ──────────────────────────────────────────────────────────────

export const otbMasterApi = {
  brands: async (): Promise<Brand[]> => {
    const wire = await invokeService<BrandWire[]>(API_CONFIG.otb.brandAll);
    return wire.map(toBrand);
  },

  categories: async (): Promise<Category[]> => {
    const wire = await invokeService<CategoryWire[]>(API_CONFIG.otb.categoryAll);
    return wire.map(toCategory);
  },

  categoriesByBrand: async (brandUuid: string): Promise<Category[]> => {
    const wire = await invokeService<CategoryWire[]>(
      API_CONFIG.otb.categoryByBrand,
      { brandUuid },
    );
    return wire.map(toCategory);
  },
};
