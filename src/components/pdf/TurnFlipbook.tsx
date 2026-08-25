import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
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
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const renderedPagesRef = useRef<Set<number>>(new Set());

    // Page Dimensions based on scale
    const baseW = Math.max(300, baseDimensions.width);
    const baseH = Math.max(400, baseDimensions.height);
    const displayWidth = Math.floor(baseW * scale);
    const displayHeight = Math.floor(baseH * scale);

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

    // Render individual PDF page on demand onto canvas
    const renderPdfCanvas = useCallback(
      async (canvas: HTMLCanvasElement, pageNum: number) => {
        if (!pdfDocument || pageNum < 1 || pageNum > totalPages) return;
        try {
          const page = await pdfDocument.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1.0 });

          if (onDimensionsLoaded && pageNum === 1) {
            onDimensionsLoaded({
              width: unscaledViewport.width,
              height: unscaledViewport.height,
            });
          }

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: (displayWidth / unscaledViewport.width) * dpr });
          const displayViewport = page.getViewport({ scale: displayWidth / unscaledViewport.width });

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${Math.floor(displayViewport.width)}px`;
          canvas.style.height = `${Math.floor(displayViewport.height)}px`;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return;

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
        }
      },
      [pdfDocument, totalPages, displayWidth, onDimensionsLoaded]
    );

    // Render visible pages in page-flip window
    const renderSurroundingPages = useCallback(
      (targetPageNum: number) => {
        const pagesToRender = [
          targetPageNum - 2,
          targetPageNum - 1,
          targetPageNum,
          targetPageNum + 1,
          targetPageNum + 2,
        ].filter(p => p >= 1 && p <= totalPages);

        pagesToRender.forEach(p => {
          const canvas = document.getElementById(`flip-canvas-${p}`) as HTMLCanvasElement;
          if (canvas && !renderedPagesRef.current.has(p)) {
            renderPdfCanvas(canvas, p);
          }
        });
      },
      [totalPages, renderPdfCanvas]
    );

    // Detect mobile screen mode
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    const containerWidth = isMobileScreen ? displayWidth : displayWidth * 2;

    // Initialize PageFlip engine
    useEffect(() => {
      const bookEl = bookRef.current;
      if (!bookEl || !pdfDocument || totalPages === 0) return;

      // Clean up previous instance if exists
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch {}
        pageFlipInstanceRef.current = null;
      }
      renderedPagesRef.current.clear();

      const isMobile = window.innerWidth < 768;

      const pageFlip = new PageFlip(bookEl, {
        width: displayWidth,
        height: displayHeight,
        size: 'fixed',
        minWidth: 200,
        maxWidth: 1400,
        minHeight: 300,
        maxHeight: 1800,
        maxShadowOpacity: 0.4,
        showCover: false,
        mobileScrollSupport: false,
        flippingTime: 500,
        usePortrait: isMobile,
        startPage: Math.max(0, Math.min(currentPage - 1, totalPages - 1)),
        drawShadow: true,
        autoSize: true,
        useMouseEvents: true,
        showPageCorners: true,
        swipeDistance: 20,
      });

      const pageElements = bookEl.querySelectorAll<HTMLElement>('.page');
      if (pageElements.length > 0) {
        pageFlip.loadFromHTML(pageElements);
        pageFlipInstanceRef.current = pageFlip;
        setIsInitialized(true);

        // Pre-render visible pages
        renderSurroundingPages(currentPage);

        // Eagerly render all remaining pages in background
        for (let p = 1; p <= totalPages; p++) {
          const canvas = document.getElementById(`flip-canvas-${p}`) as HTMLCanvasElement;
          if (canvas) {
            renderPdfCanvas(canvas, p);
          }
        }

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
    }, [pdfDocument, displayWidth, displayHeight, totalPages, renderPdfCanvas, renderSurroundingPages, onPageChange, currentPage]);

    // Update surrounding canvas renders when currentPage changes from external control
    useEffect(() => {
      if (isInitialized) {
        renderSurroundingPages(currentPage);
      }
    }, [currentPage, isInitialized, renderSurroundingPages]);

    return (
      <div
        ref={containerRef}
        className="relative w-full flex items-center justify-center select-none overflow-visible p-1 sm:p-6"
      >
        <div
          key={`${containerWidth}-${displayHeight}-${totalPages}`}
          ref={bookRef}
          className="turnjs-flipbook-container shadow-2xl rounded-lg mx-auto"
          style={{
            width: `${containerWidth}px`,
            height: `${displayHeight}px`,
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
