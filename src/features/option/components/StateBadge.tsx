import { Tag } from '@/components/primitives';
import { OP_STATE_LABELS, OP_STATE_TONES, type OpState } from '../constants';

const TONE_TO_SEVERITY: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  neutral: 'default',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export function StateBadge({ state }: { state: OpState }) {
  return (
    <Tag
      label={OP_STATE_LABELS[state]}
      severity={TONE_TO_SEVERITY[OP_STATE_TONES[state]]}
    />
  );
}
