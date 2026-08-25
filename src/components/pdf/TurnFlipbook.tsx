import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PageFlip } from 'page-flip';
import { playPageTurnSound } from '../../lib/pageAudio';
import { Loader2 } from 'lucide-react';

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

// 1x1 pure white JPEG placeholder
const BLANK_PAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

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
    const [isInitialReady, setIsInitialReady] = useState<boolean>(false);
    const [backgroundProgress, setBackgroundProgress] = useState<{ loaded: number; total: number }>({
      loaded: 0,
      total: totalPages,
    });

    const renderedImagesRef = useRef<string[]>(new Array(totalPages).fill(BLANK_PAGE_DATA_URL));
    const isRenderingRef = useRef<boolean>(false);

    // Page Dimensions based on scale
    const baseW = Math.max(300, baseDimensions.width);
    const baseH = Math.max(400, baseDimensions.height);
    const displayWidth = Math.floor(baseW * scale);
    const displayHeight = Math.floor(baseH * scale);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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

    // Helper: render a single page to crisp image
    const renderSinglePage = useCallback(
      async (pageNum: number, renderScale: number): Promise<string> => {
        try {
          const page = await pdfDocument.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) return BLANK_PAGE_DATA_URL;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await (page as any).render({
            canvasContext: ctx,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          // Free canvas memory
          canvas.width = 0;
          canvas.height = 0;
          return dataUrl;
        } catch (err) {
          console.warn(`Error rendering page ${pageNum}:`, err);
          return BLANK_PAGE_DATA_URL;
        }
      },
      [pdfDocument]
    );

    // Progressive streaming loader: Page 1-2 immediately, remainder in background chunks
    useEffect(() => {
      let isCancelled = false;
      isRenderingRef.current = true;
      renderedImagesRef.current = new Array(totalPages).fill(BLANK_PAGE_DATA_URL);

      const loadProgressively = async () => {
        if (!pdfDocument || totalPages === 0) return;

        try {
          // 1. Check dimensions from page 1
          const firstPage = await pdfDocument.getPage(1);
          const unscaledVp = firstPage.getViewport({ scale: 1.0 });
          if (onDimensionsLoaded) {
            onDimensionsLoaded({
              width: unscaledVp.width,
              height: unscaledVp.height,
            });
          }

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const renderScale = Math.max(1.1, Math.min(1.6, ((displayWidth * 1.25) / unscaledVp.width) * dpr));

          // 2. High priority: Render initial pages (1 to 4) immediately so flipbook opens in < 300ms
          const initialCount = Math.min(totalPages, 4);
          for (let p = 1; p <= initialCount; p++) {
            if (isCancelled) return;
            const img = await renderSinglePage(p, renderScale);
            renderedImagesRef.current[p - 1] = img;
          }

          if (!isCancelled) {
            setIsInitialReady(true);
            setBackgroundProgress({ loaded: initialCount, total: totalPages });
          }

          // 3. Background priority: Stream remaining pages sequentially without freezing UI
          for (let p = initialCount + 1; p <= totalPages; p++) {
            if (isCancelled) return;

            // Yield thread for 15ms to allow silky smooth 60fps flipping animations
            await new Promise(r => setTimeout(r, 15));

            const img = await renderSinglePage(p, renderScale);
            renderedImagesRef.current[p - 1] = img;

            if (!isCancelled) {
              setBackgroundProgress({ loaded: p, total: totalPages });
              // Update flipbook page textures dynamically every 4 pages or on final page
              if (p % 4 === 0 || p === totalPages) {
                if (pageFlipInstanceRef.current) {
                  try {
                    pageFlipInstanceRef.current.updateFromImages([...renderedImagesRef.current]);
                  } catch {}
                }
              }
            }
          }
        } catch (err) {
          console.error('Progressive render error:', err);
        } finally {
          isRenderingRef.current = false;
        }
      };

      loadProgressively();

      return () => {
        isCancelled = true;
      };
    }, [pdfDocument, totalPages, displayWidth, onDimensionsLoaded, renderSinglePage]);

    // Initialize PageFlip instance once initial pages are ready
    useEffect(() => {
      const bookEl = bookRef.current;
      if (!bookEl || !isInitialReady) return;

      // Clean up previous instance
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch {}
        pageFlipInstanceRef.current = null;
      }
      bookEl.innerHTML = '';

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

      pageFlip.loadFromImages([...renderedImagesRef.current]);
      pageFlipInstanceRef.current = pageFlip;

      // Event listeners
      pageFlip.on('flip', (e: any) => {
        const newPageIndex = typeof e.data === 'number' ? e.data : 0;
        const newPageNumber = newPageIndex + 1;
        playPageTurnSound();
        onPageChange(newPageNumber);
      });

      pageFlip.on('changeState', (e: any) => {
        if (e.data === 'flipping') {
          playPageTurnSound();
        }
      });

      return () => {
        if (pageFlipInstanceRef.current) {
          try {
            pageFlipInstanceRef.current.destroy();
          } catch {}
          pageFlipInstanceRef.current = null;
        }
      };
    }, [isInitialReady, displayWidth, displayHeight, totalPages, onPageChange]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center select-none overflow-visible p-2 sm:p-6"
      >
        {!isInitialReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm z-20">
            <Loader2 className="w-9 h-9 text-brand-400 animate-spin mb-3" />
            <p className="text-slate-300 text-xs sm:text-sm font-medium tracking-wide">
              Opening Publication...
            </p>
          </div>
        )}

        {/* Subtle background streaming indicator for large PDFs */}
        {isInitialReady && backgroundProgress.loaded < backgroundProgress.total && (
          <div className="absolute top-3 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span>
              Indexing pages {backgroundProgress.loaded}/{backgroundProgress.total}...
            </span>
          </div>
        )}

        <div
          ref={bookRef}
          className="turnjs-flipbook-container shadow-2xl rounded-lg mx-auto"
          style={{
            width: `${isMobile ? displayWidth : displayWidth * 2}px`,
            height: `${displayHeight}px`,
            minHeight: '280px',
          }}
        />
      </div>
    );
  }
);

TurnFlipbook.displayName = 'TurnFlipbook';
