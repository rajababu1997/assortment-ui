import { Download, FileText } from 'lucide-react';
import { Button, Dialog } from '@/components/primitives';

export interface PdfViewerDialogProps {
  visible: boolean;
  onHide: () => void;
  src?: string;
  title?: string;
  fileName?: string;
}

export function PdfViewerDialog({
  visible,
  onHide,
  src,
  title = 'PDF Viewer',
  fileName,
}: PdfViewerDialogProps) {
  const handleDownload = () => {
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    link.download = fileName ?? 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={visible}
      onClose={onHide}
      size="xl"
      closeOnBackdrop
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <span>{title}</span>
          {src && fileName && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Download size={13} strokeWidth={2} />}
              onClick={handleDownload}
            >
              Download
            </Button>
          )}
        </div>
      }
    >
      {src ? (
        <iframe
          src={src}
          title={title}
          style={{ width: '100%', height: '75vh', border: 0 }}
          sandbox="allow-same-origin allow-scripts allow-popups"
          aria-label={`PDF document: ${title}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-8 h-full text-center" style={{ minHeight: 300 }}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
            style={{ background: 'var(--color-surface-alt)' }}
          >
            <FileText size={24} strokeWidth={2} />
          </div>
          <p style={{ color: 'var(--color-text)', fontWeight: 600 }}>No PDF Available</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Document will appear here when available</p>
        </div>
      )}
    </Dialog>
  );
}
