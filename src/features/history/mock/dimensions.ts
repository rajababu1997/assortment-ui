/**
 * Shared mock dimension lookups kept for the OTB Release `SalesHistorySection`
 * tabs (ChannelMixTab, ThreeYearTab) and the weeklyVelocity synthesiser.
 *
 * The old `/history` page that originally owned these was retired in favour
 * of `/saleshistory`; these tiny lookups stay because the OTB release flow
 * still depends on them at import time.
 */

export interface Cluster {
  key: string;
  label: string;
}

export const CLUSTERS: Cluster[] = [
  { key: 'metro_online',   label: 'Metro · Online' },
  { key: 'metro_premium',  label: 'Metro · Premium Mall' },
  { key: 'tier1_offline',  label: 'Tier-1 · High-Street' },
  { key: 'tier2_offline',  label: 'Tier-2 · City' },
  { key: 'tier3_offline',  label: 'Tier-3 · Town' },
];
