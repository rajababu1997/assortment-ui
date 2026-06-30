/**
 * Append-only conversation strip — renders the full thread oldest-first.
 * Each entry shows the actor's role, what they did, the round number and
 * (optional) body text. Collapsible header so the editor body stays
 * uncluttered when there's not much to see.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import type { OptionComment } from '../types';
import { OP_ACTIONS, type OpAction } from '../constants';

const ACTION_LABEL: Record<OpAction, string> = {
  [OP_ACTIONS.SAVE_DRAFT]: 'Saved draft',
  [OP_ACTIONS.SUBMIT]: 'Submitted',
  [OP_ACTIONS.APPROVE]: 'Approved',
  [OP_ACTIONS.REQUEST_REVISIONS]: 'Requested revisions',
  [OP_ACTIONS.NOTE]: 'Commented',
};

const ACTION_TONE: Record<OpAction, string> = {
  [OP_ACTIONS.SAVE_DRAFT]: 'var(--color-text-tertiary)',
  [OP_ACTIONS.SUBMIT]: '#1d4ed8',
  [OP_ACTIONS.APPROVE]: '#15803d',
  [OP_ACTIONS.REQUEST_REVISIONS]: '#b45309',
  [OP_ACTIONS.NOTE]: 'var(--color-text-secondary)',
};

function fmtTime(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function ConversationThread({ comments }: { comments: OptionComment[] }) {
  const [open, setOpen] = useState(comments.length > 0);

  return (
    <section
      className="rounded-lg border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <div className="flex items-center gap-2 text-sm">
          <MessageSquare size={14} style={{ color: 'var(--color-text-tertiary)' }} />
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Option Plan Conversation
          </span>
          <span style={{ color: 'var(--color-text-tertiary)' }}>
            ({comments.length})
          </span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <ul className="divide-y px-3.5 pb-3" style={{ borderColor: 'var(--color-divider)' }}>
          {comments.length === 0 && (
            <li className="py-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              No conversation yet — the thread will populate as buyer and designer act.
            </li>
          )}
          {comments.map((c, i) => (
            <li key={c.uuid ?? i} className="py-3">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {c.author_name ?? c.author_role ?? 'user'}
                  {c.author_name && c.author_role && (
                    <span className="ml-1 font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
                      ({c.author_role.toLowerCase()})
                    </span>
                  )}
                </span>
                <span style={{ color: ACTION_TONE[c.action] }}>
                  · {ACTION_LABEL[c.action]}
                </span>
                <span>· round {c.round_no}</span>
                <span>· {fmtTime(c.created_time)}</span>
              </div>
              {c.body && (
                <p
                  className="mt-1 whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {c.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
