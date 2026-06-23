import { Tag } from '@/components/primitives';
import { VP_STATE_LABELS, VP_STATE_TONES, type VpState } from '../constants';

const TONE_TO_SEVERITY: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function StateBadge({ state }: { state: VpState }) {
  return (
    <Tag
      label={VP_STATE_LABELS[state]}
      severity={TONE_TO_SEVERITY[VP_STATE_TONES[state]]}
    />
  );
}
