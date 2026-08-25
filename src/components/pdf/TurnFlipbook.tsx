import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PageFlip } from 'page-flip';
import { playPageTurnSound } from '../../lib/pageAudio';

export interface TurnFlipbookHandle {
  flipNext: () => void;
  flipPrev: () => void;
  flipToPage: (page: number) => void;
}

interface TurnFlipbookProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  scale: number;
  baseDimensions: { width: number; height: number };
  onPageChange: (newPage: number) => void;
  onDimensionsLoaded?: (dims: { width: number; height: number }) => void;
}

export const TurnFlipbook = forwardRef<TurnFlipbookHandle, TurnFlipbookProps>(
  (
    {
      pdfDocument,
      currentPage,
      totalPages,
      scale,
      baseDimensions,
      onPageChange,
      onDimensionsLoaded,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const bookRef = useRef<HTMLDivElement | null>(null);
    const pageFlipInstanceRef = useRef<PageFlip | null>(null);
    const renderedPagesRef = useRef<Set<number>>(new Set());
    const renderingPagesRef = useRef<Set<number>>(new Set());

    // Page Dimensions based on scale
    const baseW = Math.max(300, baseDimensions.width);
    const baseH = Math.max(400, baseDimensions.height);
    const displayWidth = Math.floor(baseW * scale);
    const displayHeight = Math.floor(baseH * scale);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const containerWidth = isMobile ? displayWidth : displayWidth * 2;

    // Expose control methods to parent toolbar
    useImperativeHandle(
      ref,
      () => ({
        flipNext: () => {
          if (pageFlipInstanceRef.current) {
            playPageTurnSound();
            pageFlipInstanceRef.current.flipNext('bottom');
          }
        },
        flipPrev: () => {
          if (pageFlipInstanceRef.current) {
            playPageTurnSound();
            pageFlipInstanceRef.current.flipPrev('bottom');
          }
        },
        flipToPage: (page: number) => {
          if (pageFlipInstanceRef.current) {
            playPageTurnSound();
            pageFlipInstanceRef.current.turnToPage(Math.max(0, Math.min(page - 1, totalPages - 1)));
          }
        },
      }),
      [totalPages]
    );

    // Direct GPU Canvas rendering for individual page - executes in < 25ms
    const renderPageDirect = useCallback(
      async (pageNum: number) => {
        if (!pdfDocument || pageNum < 1 || pageNum > totalPages) return;
        if (renderedPagesRef.current.has(pageNum) || renderingPagesRef.current.has(pageNum)) return;

        const canvas = document.getElementById(`flip-canvas-${pageNum}`) as HTMLCanvasElement;
        if (!canvas) return;

        renderingPagesRef.current.add(pageNum);

        try {
          const page = await pdfDocument.getPage(pageNum);
          const unscaledVp = page.getViewport({ scale: 1.0 });

          if (onDimensionsLoaded && pageNum === 1) {
            onDimensionsLoaded({
              width: unscaledVp.width,
              height: unscaledVp.height,
            });
          }

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const renderScale = (displayWidth / unscaledVp.width) * dpr;
          const viewport = page.getViewport({ scale: renderScale });

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await (page as any).render({
            canvasContext: ctx,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          renderedPagesRef.current.add(pageNum);
        } catch (err: any) {
          if (err.name !== 'RenderingCancelledException') {
            console.warn(`Error rendering page ${pageNum}:`, err);
          }
        } finally {
          renderingPagesRef.current.delete(pageNum);
        }
      },
      [pdfDocument, totalPages, displayWidth, displayHeight, onDimensionsLoaded]
    );

    // Render active and surrounding pages dynamically
    const renderSurroundingPages = useCallback(
      (targetPage: number) => {
        const pages = [
          targetPage - 2,
          targetPage - 1,
          targetPage,
          targetPage + 1,
          targetPage + 2,
          targetPage + 3,
        ].filter(p => p >= 1 && p <= totalPages);

        pages.forEach(p => {
          renderPageDirect(p);
        });
      },
      [totalPages, renderPageDirect]
    );

    // Initialize PageFlip engine immediately on mount (0ms delay)
    useEffect(() => {
      const bookEl = bookRef.current;
      if (!bookEl || !pdfDocument || totalPages === 0) return;

      // Clean up previous instance
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch {}
        pageFlipInstanceRef.current = null;
      }
      renderedPagesRef.current.clear();
      renderingPagesRef.current.clear();

      const isMobileScreen = window.innerWidth < 768;

      const pageFlip = new PageFlip(bookEl, {
        width: displayWidth,
        height: displayHeight,
        size: 'fixed',
        minWidth: 200,
        maxWidth: 1600,
        minHeight: 300,
        maxHeight: 2000,
        maxShadowOpacity: 0.45,
        showCover: false,
        mobileScrollSupport: false,
        flippingTime: 550,
        usePortrait: isMobileScreen,
        startPage: Math.max(0, Math.min(currentPage - 1, totalPages - 1)),
        drawShadow: true,
        autoSize: true,
        useMouseEvents: true,
        showPageCorners: true,
        swipeDistance: 25,
      });

      const pageElements = bookEl.querySelectorAll<HTMLElement>('.page');
      if (pageElements.length > 0) {
        pageFlip.loadFromHTML(pageElements);
        pageFlipInstanceRef.current = pageFlip;

        // Render initial active pages instantly
        renderSurroundingPages(currentPage);

        // Preload upcoming pages smoothly
        setTimeout(() => {
          for (let p = 1; p <= Math.min(totalPages, 8); p++) {
            renderPageDirect(p);
          }
        }, 100);

        // Event listeners
        pageFlip.on('flip', (e: any) => {
          const newPageIndex = typeof e.data === 'number' ? e.data : 0;
          const newPageNumber = newPageIndex + 1;
          playPageTurnSound();
          onPageChange(newPageNumber);
          renderSurroundingPages(newPageNumber);
        });

        pageFlip.on('changeState', (e: any) => {
          if (e.data === 'flipping') {
            playPageTurnSound();
          }
        });
      }

      return () => {
        if (pageFlipInstanceRef.current) {
          try {
            pageFlipInstanceRef.current.destroy();
          } catch {}
          pageFlipInstanceRef.current = null;
        }
      };
    }, [pdfDocument, displayWidth, displayHeight, totalPages, renderSurroundingPages, renderPageDirect, onPageChange, currentPage]);

    // Keep surrounding pages loaded when currentPage changes
    useEffect(() => {
      renderSurroundingPages(currentPage);
    }, [currentPage, renderSurroundingPages]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center select-none overflow-visible p-2 sm:p-6"
      >
        <div
          ref={bookRef}
          className="turnjs-flipbook-container shadow-2xl rounded-lg mx-auto"
          style={{
            width: `${containerWidth}px`,
            height: `${displayHeight}px`,
            minHeight: '280px',
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <div
              key={pageNum}
              className="page bg-white overflow-hidden"
              data-density="soft"
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
                backgroundColor: '#ffffff',
              }}
            >
              <div
                className="page-content relative w-full h-full flex items-center justify-center bg-white overflow-hidden"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                }}
              >
                <canvas
                  id={`flip-canvas-${pageNum}`}
                  className="block bg-white"
                  style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

TurnFlipbook.displayName = 'TurnFlipbook';
