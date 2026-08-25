import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PageFlip } from 'page-flip';
import { playPageTurnSound } from '../../lib/pageAudio';
import { Loader2 } from 'lucide-react';

export interface StPageFlipHandle {
  flipNext: () => void;
  flipPrev: () => void;
  flipToPage: (page: number) => void;
}

interface StPageFlipBookProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  scale: number;
  isDual: boolean;
  baseDimensions: { width: number; height: number };
  onPageChange: (newPage: number) => void;
  onPageLoaded?: (dims: { width: number; height: number }) => void;
}

export const StPageFlipBook = forwardRef<StPageFlipHandle, StPageFlipBookProps>(
  (
    {
      pdfDocument,
      currentPage,
      totalPages,
      scale,
      onPageChange,
      onPageLoaded,
    },
    ref
  ) => {
    const stageContainerRef = useRef<HTMLDivElement | null>(null);
    const bookContainerRef = useRef<HTMLDivElement | null>(null);
    const pageFlipInstanceRef = useRef<PageFlip | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(0);
    const [pageImages, setPageImages] = useState<string[]>([]);
    const [bookSize, setBookSize] = useState<{ width: number; height: number }>({ width: 500, height: 700 });

    // Expose imperative flip controls
    useImperativeHandle(ref, () => ({
      flipNext: () => {
        try {
          pageFlipInstanceRef.current?.flipNext('bottom');
        } catch {
          // fallback
        }
      },
      flipPrev: () => {
        try {
          pageFlipInstanceRef.current?.flipPrev('bottom');
        } catch {
          // fallback
        }
      },
      flipToPage: (targetPage: number) => {
        try {
          const index = Math.max(0, Math.min(targetPage - 1, totalPages - 1));
          pageFlipInstanceRef.current?.flip(index, 'bottom');
        } catch {
          // fallback
        }
      },
    }));

    // Step 1: Render all PDF pages to high-resolution JPEG DataURLs in background
    useEffect(() => {
      let isCancelled = false;

      async function renderAllPages() {
        setIsLoading(true);
        setProgress(0);

        try {
          // First get page 1 dimensions
          const firstPage = await pdfDocument.getPage(1);
          const firstViewport = firstPage.getViewport({ scale: 1 });
          const rawW = firstViewport.width;
          const rawH = firstViewport.height;

          if (onPageLoaded) {
            onPageLoaded({ width: rawW, height: rawH });
          }

          // Calculate display size for book based on container size
          const stageEl = stageContainerRef.current;
          const stageW = stageEl ? stageEl.clientWidth - 40 : window.innerWidth - 40;
          const stageH = stageEl ? stageEl.clientHeight - 40 : window.innerHeight - 140;

          const isLandscapePdf = rawW >= rawH;
          const isMobile = window.innerWidth < 768;

          let targetPageW: number;
          let targetPageH: number;

          if (isMobile) {
            // Full mobile width fill (100% of mobile screen width, zero waste!)
            targetPageW = Math.min(window.innerWidth - 8, 480);
            targetPageH = Math.round((rawH / rawW) * targetPageW);
          } else if (isLandscapePdf) {
            // Desktop landscape slide
            const fitW = (stageW - 20) / rawW;
            const fitH = (stageH - 20) / rawH;
            const fit = Math.min(fitW, fitH, 1.5);
            targetPageW = Math.round(rawW * fit);
            targetPageH = Math.round(rawH * fit);
          } else {
            // Dual spread fitting on desktop (two pages side by side)
            const fitW = (stageW - 30) / (rawW * 2);
            const fitH = (stageH - 20) / rawH;
            const fit = Math.min(fitW, fitH, 1.5);
            targetPageW = Math.round(rawW * fit);
            targetPageH = Math.round(rawH * fit);
          }

          setBookSize({ width: Math.max(300, targetPageW), height: Math.max(400, targetPageH) });

          const renderedUrls: string[] = [];
          // Ultra-high DPI scale for crystal clear, razor-sharp text and graphics
          const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
          const renderScale = Math.max(2.5, dpr * 2.0);

          for (let i = 1; i <= totalPages; i++) {
            if (isCancelled) return;

            const page = i === 1 ? firstPage : await pdfDocument.getPage(i);
            const viewport = page.getViewport({ scale: renderScale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext('2d', { alpha: false });

            if (ctx) {
              // Enable high quality image smoothing
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              const renderTask = page.render({
                canvasContext: ctx,
                viewport: viewport,
                canvas: canvas,
                intent: 'display',
              } as any);

              await renderTask.promise;
              // Use high quality WebP/PNG for ultra-sharp typography without JPEG artifacts
              let dataUrl: string;
              try {
                dataUrl = canvas.toDataURL('image/webp', 0.98);
                if (!dataUrl.startsWith('data:image/webp')) {
                  dataUrl = canvas.toDataURL('image/png');
                }
              } catch {
                dataUrl = canvas.toDataURL('image/png');
              }
              renderedUrls.push(dataUrl);
            }

            setProgress(Math.round((i / totalPages) * 100));
          }

          if (!isCancelled) {
            setPageImages(renderedUrls);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Failed to render PDF pages for PageFlip:', err);
          if (!isCancelled) {
            setIsLoading(false);
          }
        }
      }

      renderAllPages();

      return () => {
        isCancelled = true;
      };
    }, [pdfDocument, totalPages]);

    // Step 2: Initialize StPageFlip once images are ready
    useEffect(() => {
      if (isLoading || pageImages.length === 0 || !bookContainerRef.current) return;

      // Clean up previous instance
      if (pageFlipInstanceRef.current) {
        try {
          pageFlipInstanceRef.current.destroy();
        } catch {
          // ignore
        }
        pageFlipInstanceRef.current = null;
      }

      // Empty container element
      bookContainerRef.current.innerHTML = '';

      const isMobile = window.innerWidth < 768;
      const isLandscape = bookSize.width >= bookSize.height;

      const pageFlip = new PageFlip(bookContainerRef.current, {
        width: bookSize.width,
        height: bookSize.height,
        size: 'stretch',
        minWidth: 200,
        maxWidth: 2400,
        minHeight: 300,
        maxHeight: 2000,
        drawShadow: true,
        maxShadowOpacity: 0.5,
        flippingTime: 700,
        usePortrait: isMobile || isLandscape,
        startPage: Math.max(0, currentPage - 1),
        startZIndex: 5,
        autoSize: true,
        showCover: !isLandscape, // cover effect for portrait books
        mobileScrollSupport: false,
        useMouseEvents: true,
        swipeDistance: 30,
        clickEventForward: false,
      });

      pageFlip.loadFromImages(pageImages);

      pageFlip.on('flip', (e) => {
        const pageIdx = typeof e.data === 'number' ? e.data : 0;
        onPageChange(pageIdx + 1);
        playPageTurnSound();
      });

      pageFlipInstanceRef.current = pageFlip;

      return () => {
        if (pageFlipInstanceRef.current) {
          try {
            pageFlipInstanceRef.current.destroy();
          } catch {
            // ignore
          }
          pageFlipInstanceRef.current = null;
        }
      };
    }, [isLoading, pageImages, bookSize]);

    return (
      <div
        ref={stageContainerRef}
        className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden"
      >
        {/* Loading Spinner during initial page rendering */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl">
              <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-200">Preparing 4K HD Flipbook...</p>
                <p className="text-xs text-slate-400 mt-1">Rendering high-resolution vector pages ({progress}%)</p>
              </div>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* The PageFlip book mount element with zoom support */}
        <div
          ref={bookContainerRef}
          className="relative mx-auto drop-shadow-2xl flex items-center justify-center transition-transform duration-200"
          style={{
            visibility: isLoading ? 'hidden' : 'visible',
            transform: scale && scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'center center',
          }}
        />
      </div>
    );
  }
);

StPageFlipBook.displayName = 'StPageFlipBook';
