import { invokeService } from '@/services/invokeService';
import { API_CONFIG } from '@/constants/apiConfig';
import type { SampleItem } from './types';

export const sampleApi = {
  list: () => invokeService<SampleItem[]>(API_CONFIG.sample.list),
  get: (uuid: string) => invokeService<SampleItem>(API_CONFIG.sample.get, { uuid }),
  create: (payload: Omit<SampleItem, 'uuid'>) => invokeService<SampleItem>(API_CONFIG.sample.create, undefined, payload),
  update: (uuid: string, payload: Partial<SampleItem>) =>
    invokeService<SampleItem>(API_CONFIG.sample.update, { uuid }, payload),
  remove: (uuid: string) => invokeService<void>(API_CONFIG.sample.delete, { uuid }),
};
