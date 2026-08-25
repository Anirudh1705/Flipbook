import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPageCanvas } from './PdfPageCanvas';

interface PdfScrollPageProps {
  pdfDocument: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  baseDimensions: { width: number; height: number };
  onVisible?: (pageNumber: number) => void;
  onDimensionsLoaded?: (dims: { width: number; height: number }) => void;
}

export const PdfScrollPage: React.FC<PdfScrollPageProps> = ({
  pdfDocument,
  pageNumber,
  scale,
  baseDimensions,
  onVisible,
  onDimensionsLoaded,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInViewport, setIsInViewport] = useState<boolean>(pageNumber <= 2);

  // IntersectionObserver to only render canvas when scrolled into view (plus 400px buffer)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInViewport(true);
            if (onVisible && entry.intersectionRatio > 0.4) {
              onVisible(pageNumber);
            }
          } else {
            // Memory conservation: unload canvas when far outside view (>800px away)
            const bounds = entry.boundingClientRect;
            const windowHeight = window.innerHeight;
            if (bounds.bottom < -800 || bounds.top > windowHeight + 800) {
              setIsInViewport(false);
            }
          }
        });
      },
      {
        rootMargin: '400px 0px 400px 0px',
        threshold: [0, 0.4, 0.8],
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [pageNumber, onVisible]);

  const targetWidth = Math.floor(baseDimensions.width * scale);
  const targetHeight = Math.floor(baseDimensions.height * scale);

  return (
    <div
      id={`page-container-${pageNumber}`}
      ref={containerRef}
      style={{
        width: `${targetWidth}px`,
        minHeight: `${targetHeight}px`,
      }}
      className="relative my-4 mx-auto rounded-xl overflow-hidden bg-white shadow-2xl border border-slate-800/80 transition-all duration-150"
    >
      {isInViewport ? (
        <PdfPageCanvas
          pdfDocument={pdfDocument}
          pageNumber={pageNumber}
          scale={scale}
          side="single"
          onPageLoaded={onDimensionsLoaded}
        />
      ) : (
        /* Placeholder to maintain scroll height and prevent layout shift */
        <div
          style={{ width: `${targetWidth}px`, height: `${targetHeight}px` }}
          className="flex items-center justify-center bg-slate-900/40 text-slate-500 font-mono text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
            <span>Page {pageNumber}</span>
          </div>
        </div>
      )}

      {/* Floating subtle page number tag */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/70 text-slate-300 text-[10px] font-mono border border-slate-800/80 backdrop-blur-sm pointer-events-none">
        {pageNumber}
      </div>
    </div>
  );
};
