import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

interface PdfPageCanvasProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  side?: 'left' | 'right' | 'single';
  className?: string;
  onPageLoaded?: (baseDimensions: { width: number; height: number }) => void;
}

export const PdfPageCanvas: React.FC<PdfPageCanvasProps> = ({
  pdfDocument,
  pageNumber,
  scale,
  side = 'single',
  className = '',
  onPageLoaded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);
  const pageProxyRef = useRef<PDFPageProxy | null>(null);
  const hasReportedDimsRef = useRef<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    if (!pdfDocument || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      return;
    }

    async function renderPage() {
      try {
        setError(null);

        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const page = await pdfDocument.getPage(pageNumber);
        pageProxyRef.current = page;

        if (isCancelled) return;

        // Unscaled base dimensions (scale: 1.0)
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        if (onPageLoaded && !hasReportedDimsRef.current) {
          hasReportedDimsRef.current = true;
          onPageLoaded({ width: unscaledViewport.width, height: unscaledViewport.height });
        }

        // Target rendering viewport with DPR for crisp text
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        const displayViewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        // High DPI canvas configuration
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(displayViewport.width)}px`;
        canvas.style.height = `${Math.floor(displayViewport.height)}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = (page as any).render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn(`Render error on page ${pageNumber}:`, err);
          setError('Page render error');
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
      // Memory cleanup: clean page resources
      if (pageProxyRef.current) {
        try {
          pageProxyRef.current.cleanup();
        } catch {}
      }
    };
  }, [pdfDocument, pageNumber, scale]);

  // Distinct shadow and spine lighting based on book side
  const getSideShadowClass = () => {
    if (side === 'left') return 'page-shadow-left border-r border-slate-800/60';
    if (side === 'right') return 'page-shadow-right border-l border-slate-800/60';
    return 'shadow-2xl';
  };

  return (
    <div
      className={`relative inline-block select-none overflow-hidden bg-white ${getSideShadowClass()} ${className}`}
    >
      <canvas ref={canvasRef} className="block transition-opacity duration-200" />

      {error && (
        <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center p-4 text-center">
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
};
