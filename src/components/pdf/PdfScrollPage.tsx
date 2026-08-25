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
          }
        });
      },
      {
        rootMargin: '1200px 0px 1200px 0px',
        threshold: [0, 0.2, 0.5],
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
        maxWidth: '100%',
        width: targetWidth > 0 ? `${targetWidth}px` : '100%',
        minHeight: targetHeight > 0 ? `${targetHeight}px` : '400px',
        touchAction: 'pan-y',
      }}
      className="relative my-2 sm:my-3 mx-auto rounded-lg sm:rounded-xl overflow-hidden bg-white shadow-2xl border border-slate-800/80 transition-shadow duration-300 hover:shadow-cyan-950/20"
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
          style={{
            width: targetWidth > 0 ? `${targetWidth}px` : '100%',
            height: targetHeight > 0 ? `${targetHeight}px` : '400px',
          }}
          className="bg-slate-900 flex items-center justify-center text-slate-600 text-xs font-mono"
        >
          Page {pageNumber}
        </div>
      )}
    </div>
  );
};
