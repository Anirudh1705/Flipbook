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

export const TurnFlipbook = forwardRef<TurnFlipbookHandle, TurnFlipbookProps>(
  (
    {
      pdfDocument,
      currentPage,
      totalPages,
      onPageChange,
      onDimensionsLoaded,
    },
    ref
  ) => {
    const bookContainerRef = useRef<HTMLDivElement | null>(null);
    const pageFlipInstanceRef = useRef<PageFlip | null>(null);
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const renderingPages = useRef<Set<number>>(new Set());
    const renderedPages = useRef<Set<number>>(new Set());

    const [isReady, setIsReady] = useState(false);
    const [aspectDimensions, setAspectDimensions] = useState<{ width: number; height: number }>({
      width: 595,
      height: 842,
    });

    // Expose control methods to parent (Toolbar & Shortcuts)
    useImperativeHandle(
      ref,
      () => ({
        flipNext: () => {
          if (pageFlipInstanceRef.current) {
            pageFlipInstanceRef.current.flipNext('top');
          }
        },
        flipPrev: () => {
          if (pageFlipInstanceRef.current) {
            pageFlipInstanceRef.current.flipPrev('top');
          }
        },
        flipToPage: (page: number) => {
          if (pageFlipInstanceRef.current && page >= 1 && page <= totalPages) {
            pageFlipInstanceRef.current.turnToPage(page - 1);
          }
        },
      }),
      [totalPages]
    );

    // Render an individual PDF page directly to its canvas
    const renderPageToCanvas = useCallback(
      async (pageNum: number) => {
        if (!pdfDocument || pageNum < 1 || pageNum > totalPages) return;
        if (renderingPages.current.has(pageNum) || renderedPages.current.has(pageNum)) return;

        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas) return;

        renderingPages.current.add(pageNum);

        try {
          const page = await pdfDocument.getPage(pageNum);

          // Crisp 1.5x resolution for silky performance and sharp text
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const renderScale = 1.5 * dpr;
          const viewport = page.getViewport({ scale: renderScale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            await page.render({
              canvasContext: ctx,
              viewport: viewport,
              intent: 'display',
              canvas: canvas,
            }).promise;

            renderedPages.current.add(pageNum);
          }
        } catch (err) {
          console.warn(`Failed rendering page ${pageNum}:`, err);
        } finally {
          renderingPages.current.delete(pageNum);
        }
      },
      [pdfDocument, totalPages]
    );

    // 1. Initial aspect ratio & dimensions extraction
    useEffect(() => {
      let isMounted = true;

      const initDimensions = async () => {
        try {
          const firstPage = await pdfDocument.getPage(1);
          const vp = firstPage.getViewport({ scale: 1.0 });
          if (isMounted) {
            const dims = { width: Math.round(vp.width), height: Math.round(vp.height) };
            setAspectDimensions(dims);
            onDimensionsLoaded?.(dims);
          }
        } catch (err) {
          console.error('Failed reading page 1 dimensions:', err);
        }
      };

      initDimensions();

      return () => {
        isMounted = false;
      };
    }, [pdfDocument, onDimensionsLoaded]);

    // 2. Initialize StPageFlip once container and canvases are mounted
    useEffect(() => {
      if (!bookContainerRef.current || !pdfDocument || totalPages === 0) return;

      let isMounted = true;
      renderedPages.current.clear();
      renderingPages.current.clear();

      // Pre-render first 4 pages immediately for instantaneous visual feedback
      const initialBatch = [1, 2, 3, 4].filter((p) => p <= totalPages);
      Promise.all(initialBatch.map((p) => renderPageToCanvas(p))).then(() => {
        if (!isMounted || !bookContainerRef.current) return;

        try {
          // Destroy any existing instance
          if (pageFlipInstanceRef.current) {
            pageFlipInstanceRef.current.destroy();
            pageFlipInstanceRef.current = null;
          }

          const isMobileView = window.innerWidth < 768;
          const containerWidth = bookContainerRef.current.parentElement?.clientWidth || window.innerWidth;
          const containerHeight = bookContainerRef.current.parentElement?.clientHeight || (window.innerHeight - 120);

          // Calculate fitted base page size
          const maxSingleWidth = isMobileView ? containerWidth * 0.92 : containerWidth * 0.46;
          const maxSingleHeight = containerHeight * 0.90;
          const ratio = aspectDimensions.width / aspectDimensions.height;

          let targetWidth = maxSingleWidth;
          let targetHeight = targetWidth / ratio;

          if (targetHeight > maxSingleHeight) {
            targetHeight = maxSingleHeight;
            targetWidth = targetHeight * ratio;
          }

          const pageFlip = new PageFlip(bookContainerRef.current, {
            width: Math.round(targetWidth),
            height: Math.round(targetHeight),
            size: 'stretch',
            minWidth: 280,
            maxWidth: 1200,
            minHeight: 380,
            maxHeight: 1600,
            maxShadowOpacity: 0.6,
            showCover: true,
            mobileScrollSupport: false,
            usePortrait: true,
            startPage: Math.max(0, currentPage - 1),
            drawShadow: true,
            flippingTime: 700, // Smooth flipping animation matching reference
            useMouseEvents: true,
            swipeDistance: 25,
            showPageCorners: true,
          });

          const pageElements = bookContainerRef.current.querySelectorAll<HTMLElement>('.st-page-item');
          if (pageElements.length > 0) {
            pageFlip.loadFromHTML(pageElements);

            pageFlip.on('flip', (e) => {
              const targetPage = (e.data as number) + 1;
              onPageChange(targetPage);
              playPageTurnSound();

              // Eagerly pre-render neighboring pages in background
              const upcoming = [
                targetPage - 2,
                targetPage - 1,
                targetPage,
                targetPage + 1,
                targetPage + 2,
                targetPage + 3,
              ].filter((p) => p >= 1 && p <= totalPages);

              upcoming.forEach((p) => renderPageToCanvas(p));
            });

            pageFlipInstanceRef.current = pageFlip;
            setIsReady(true);

            // Render remaining upcoming pages in background idle queue
            const renderRemaining = async () => {
              for (let p = 5; p <= totalPages; p++) {
                if (!isMounted) break;
                await renderPageToCanvas(p);
              }
            };
            setTimeout(renderRemaining, 300);
          }
        } catch (err) {
          console.error('Error initializing PageFlip:', err);
        }
      });

      return () => {
        isMounted = false;
        if (pageFlipInstanceRef.current) {
          try {
            pageFlipInstanceRef.current.destroy();
          } catch (e) {
            // ignore cleanup errors
          }
          pageFlipInstanceRef.current = null;
        }
      };
    }, [pdfDocument, totalPages, aspectDimensions, renderPageToCanvas, onPageChange]);

    // Synchronize page if changed externally (e.g. thumbnails or bottom slider)
    useEffect(() => {
      if (pageFlipInstanceRef.current && isReady) {
        const currentInstancePage = pageFlipInstanceRef.current.getCurrentPageIndex() + 1;
        if (currentInstancePage !== currentPage) {
          pageFlipInstanceRef.current.turnToPage(currentPage - 1);
        }
      }
    }, [currentPage, isReady]);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
          pageFlipInstanceRef.current?.flipNext('top');
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          pageFlipInstanceRef.current?.flipPrev('top');
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Create list of page numbers
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden py-4 px-2">
        {!isReady && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-300">Preparing 3D Interactive Flipbook...</p>
          </div>
        )}

        {/* StPageFlip Root Mount Container */}
        <div
          ref={bookContainerRef}
          className="flipbook-root-stage shadow-2xl rounded-sm"
          style={{
            perspective: '2000px',
            transformStyle: 'preserve-3d',
            opacity: isReady ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          {pageNumbers.map((pageNum) => {
            const isCover = pageNum === 1 || pageNum === totalPages;
            return (
              <div
                key={pageNum}
                className={`st-page-item bg-white overflow-hidden shadow-md flex items-center justify-center ${
                  isCover ? 'st-cover-page' : 'st-inner-page'
                }`}
                data-density={isCover ? 'hard' : 'soft'}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#ffffff',
                }}
              >
                <canvas
                  ref={(el) => {
                    if (el) {
                      canvasRefs.current.set(pageNum, el);
                      renderPageToCanvas(pageNum);
                    } else {
                      canvasRefs.current.delete(pageNum);
                    }
                  }}
                  className="w-full h-full object-contain block pointer-events-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

TurnFlipbook.displayName = 'TurnFlipbook';
