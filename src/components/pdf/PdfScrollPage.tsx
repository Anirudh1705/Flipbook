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
      className="relative my-0 mx-auto rounded-none overflow-hidden bg-white shadow-lg border-b border-slate-200/40 last:border-b-0 transition-all duration-150"
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
          className="bg-white"
        />
      )}
    </div>
  );
};
