import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
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
    const [isLoadingImages, setIsLoadingImages] = useState<boolean>(true);
    const [renderedImageUrls, setRenderedImageUrls] = useState<string[]>([]);

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

    // Render all PDF pages into crisp high-res image data URLs
    useEffect(() => {
      let isCancelled = false;

      const renderAllPages = async () => {
        if (!pdfDocument || totalPages === 0) return;
        setIsLoadingImages(true);

        try {
          // Check base dimensions from page 1
          const firstPage = await pdfDocument.getPage(1);
          const unscaledVp = firstPage.getViewport({ scale: 1.0 });
          if (onDimensionsLoaded) {
            onDimensionsLoaded({
              width: unscaledVp.width,
              height: unscaledVp.height,
            });
          }

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const renderScale = Math.max(1.5, ((displayWidth * 1.5) / unscaledVp.width) * dpr);

          const imagePromises: Promise<string>[] = [];

          for (let p = 1; p <= totalPages; p++) {
            imagePromises.push(
              (async () => {
                const page = await pdfDocument.getPage(p);
                const viewport = page.getViewport({ scale: renderScale });
                const canvas = document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                const ctx = canvas.getContext('2d', { alpha: false });
                if (!ctx) return '';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                await (page as any).render({
                  canvasContext: ctx,
                  viewport: viewport,
                  canvas: canvas,
                }).promise;

                return canvas.toDataURL('image/jpeg', 0.92);
              })()
            );
          }

          const images = await Promise.all(imagePromises);
          if (!isCancelled) {
            setRenderedImageUrls(images);
            setIsLoadingImages(false);
          }
        } catch (err) {
          console.error('Error rendering PDF pages to images:', err);
          if (!isCancelled) {
            setIsLoadingImages(false);
          }
        }
      };

      renderAllPages();

      return () => {
        isCancelled = true;
      };
    }, [pdfDocument, totalPages, displayWidth, onDimensionsLoaded]);

    // Initialize PageFlip instance with rendered images
    useEffect(() => {
      const bookEl = bookRef.current;
      if (!bookEl || renderedImageUrls.length === 0 || isLoadingImages) return;

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
        minWidth: 240,
        maxWidth: 1600,
        minHeight: 320,
        maxHeight: 2000,
        maxShadowOpacity: 0.45,
        showCover: false,
        mobileScrollSupport: false,
        flippingTime: 600,
        usePortrait: isMobileScreen,
        startPage: Math.max(0, Math.min(currentPage - 1, totalPages - 1)),
        drawShadow: true,
        autoSize: true,
        useMouseEvents: true,
        showPageCorners: true,
        swipeDistance: 25,
      });

      pageFlip.loadFromImages(renderedImageUrls);
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
    }, [renderedImageUrls, isLoadingImages, displayWidth, displayHeight, totalPages, onPageChange]);

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center select-none overflow-visible p-2 sm:p-6"
      >
        {isLoadingImages && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm z-20">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-slate-300 text-sm font-medium">Preparing Flipbook Experience...</p>
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
