import { Tag } from '@/components/primitives';
import { OTB_STATE_LABELS, OTB_STATE_TONES, type OtbState } from '../constants';

const TONE_TO_SEVERITY: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function StateBadge({ state }: { state: OtbState }) {
  return (
    <Tag label={OTB_STATE_LABELS[state]} severity={TONE_TO_SEVERITY[OTB_STATE_TONES[state]]} />
  );
}
