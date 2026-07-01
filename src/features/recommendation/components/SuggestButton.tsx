/**
 * AI auto-plan button — single component used in all three editor headers.
 *
 * Behaviour:
 *   - First click  → generates the recommendation (parent passes onClick)
 *   - Loading      → spinner
 *   - Loaded       → swaps to a secondary "regenerate" state
 * The parent owns the data; this component only handles the visual.
 */

import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/primitives';

export function SuggestButton({
  loading,
  onClick,
  hasResult,
  disabled,
  label = 'Auto-Plan',
}: {
  loading?: boolean;
  onClick: () => void;
  hasResult?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Button
      variant={hasResult ? 'secondary' : 'primary'}
      size="sm"
      leftIcon={loading
        ? <Loader2 size={13} className="animate-spin" />
        : <Sparkles size={13} />}
      onClick={onClick}
      disabled={loading || disabled}
      title="Generate a full annual plan based on last 2 years of sales + calendar events"
    >
      {loading ? 'Generating…' : hasResult ? 'Regenerate' : label}
    </Button>
  );
}
