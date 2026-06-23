import { memo, useState, type ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tooltip } from '@/components/primitives';
import type { ICellRendererParams } from 'ag-grid-community';

interface Params extends ICellRendererParams {
  /** Optional — what text to copy. Falls back to formatted / raw value. */
  getCopyValue?: (row: any, rawValue: any) => string;
  /** Optional — custom display (e.g., result of col.render). Falls back to value. */
  children?: ReactNode;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for insecure contexts
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const TpsCopyCellRenderer = memo(function TpsCopyCellRenderer(params: Params) {
  const [copied, setCopied] = useState(false);
  const rawValue = params.value;
  const display = params.valueFormatted ?? (rawValue == null ? '' : String(rawValue));
  const copyText = params.getCopyValue ? params.getCopyValue(params.data, rawValue) : display;
  const hasValue = copyText !== '' && copyText != null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasValue) return;
    const ok = await copyToClipboard(String(copyText));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <span className="tps-copy-cell group/copy">
      <span className="tps-copy-cell__value">{display}</span>
      {hasValue && (
        <Tooltip content={copied ? 'Copied' : 'Copy'} placement="top" portal>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            className={`tps-copy-cell__btn ${copied ? 'is-copied' : ''}`}
          >
            {copied ? <Check size={14} strokeWidth={2.2} /> : <Copy size={14} strokeWidth={1.8} />}
          </button>
        </Tooltip>
      )}
    </span>
  );
});

TpsCopyCellRenderer.displayName = 'TpsCopyCellRenderer';

export default TpsCopyCellRenderer;
