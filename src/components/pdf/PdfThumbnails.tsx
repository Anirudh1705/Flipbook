import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { X, Layers } from 'lucide-react';

interface PdfThumbnailsProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (page: number) => void;
}

interface ThumbnailItemProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  isActive: boolean;
  onSelect: () => void;
}

const ThumbnailItem: React.FC<ThumbnailItemProps> = ({
  pdfDocument,
  pageNumber,
  isActive,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [rendered, setRendered] = useState<boolean>(false);
  const renderTaskRef = useRef<any>(null);

  // Use IntersectionObserver to lazy load thumbnail only when in view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { rootMargin: '120px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Render thumbnail canvas once visible
  useEffect(() => {
    if (!isVisible || rendered || !pdfDocument) return;

    let isCancelled = false;

    async function drawThumbnail() {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (isCancelled) return;

        // Render at lightweight 0.18x scale for thumbnails
        const viewport = page.getViewport({ scale: 0.18 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const renderTask = (page as any).render({
          canvasContext: context,
          viewport,
          canvas,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setRendered(true);
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException' && !isCancelled) {
          // Ignore cancellation
        }
      }
    }

    drawThumbnail();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [isVisible, rendered, pdfDocument, pageNumber]);

  return (
    <div
      ref={containerRef}
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl p-2 transition-all flex flex-col items-center gap-1.5 ${
        isActive
          ? 'bg-brand-500/20 border-2 border-brand-400 shadow-md shadow-brand-500/20'
          : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-850'
      }`}
    >
      <div className="relative w-24 h-32 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
        <canvas ref={canvasRef} className={`block transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`} />

        {!rendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-[10px] text-slate-600 font-mono">
            {pageNumber}
          </div>
        )}
      </div>

      <span
        className={`text-[11px] font-mono font-medium ${
          isActive ? 'text-brand-300 font-bold' : 'text-slate-400 group-hover:text-slate-200'
        }`}
      >
        Page {pageNumber}
      </span>
    </div>
  );
};

export const PdfThumbnails: React.FC<PdfThumbnailsProps> = ({
  pdfDocument,
  currentPage,
  totalPages,
  isOpen,
  onClose,
  onSelectPage,
}) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isOpen, currentPage]);

  if (!isOpen) return null;

  return (
    <aside className="absolute top-14 bottom-0 left-0 z-40 w-72 sm:w-80 glass-toolbar border-r border-slate-800 shadow-2xl flex flex-col backdrop-blur-2xl animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <Layers className="w-4 h-4 text-brand-400" />
          <span>Page Thumbnails ({totalPages})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Sidebar"
          aria-label="Close Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lazy Virtualized Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 scrollbar-thin">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
          <div key={pageNum} ref={pageNum === currentPage ? activeRef : undefined}>
            <ThumbnailItem
              pdfDocument={pdfDocument}
              pageNumber={pageNum}
              isActive={pageNum === currentPage}
              onSelect={() => onSelectPage(pageNum)}
            />
          </div>
        ))}
      </div>
    </aside>
  );
};
