/**
 * Pinned banner that surfaces the designer's most-recent REQUEST_REVISIONS
 * comment above the editor body — so the buyer can't miss the ask while
 * editing. Only renders when the OP is in REVISIONS_REQUESTED state.
 */

import { AlertTriangle } from 'lucide-react';
import type { OptionComment } from '../types';
import { OP_ACTIONS } from '../constants';

export function RevisionBanner({ comments }: { comments: OptionComment[] }) {
  // Newest REQUEST_REVISIONS entry — backend orders by created_time ASC.
  const latest = [...comments]
    .reverse()
    .find((c) => c.action === OP_ACTIONS.REQUEST_REVISIONS);

  if (!latest?.body) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-lg border px-4 py-3"
      style={{
        background: 'color-mix(in srgb, #f59e0b 12%, transparent)',
        borderColor: 'color-mix(in srgb, #f59e0b 35%, transparent)',
      }}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#b45309' }} />
      <div className="flex-1 text-sm">
        <div className="font-semibold" style={{ color: '#92400e' }}>
          Designer requested revisions · round {latest.round_no}
        </div>
        <p className="mt-1 whitespace-pre-wrap leading-relaxed" style={{ color: '#78350f' }}>
          {latest.body}
        </p>
      </div>
    </div>
  );
}
