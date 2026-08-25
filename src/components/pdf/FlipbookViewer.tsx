import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Book } from '../../types/book';
import { PdfScrollPage } from './PdfScrollPage';
import { PdfToolbar } from './PdfToolbar';
import { PdfThumbnails } from './PdfThumbnails';
import { PdfSearchModal } from './PdfSearchModal';
import { usePdfSearch } from '../../hooks/usePdfSearch';

interface FlipbookViewerProps {
  book: Book;
  pdfDocument: PDFDocumentProxy;
}

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({ book, pdfDocument }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const totalPages = pdfDocument.numPages;

  // Viewport & Layout state - Continuous high-performance document reader
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [spreadMode, setSpreadMode] = useState<'single' | 'double'>('single');
  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const availWidth = window.innerWidth - 24;
      return Math.max(0.35, Math.min(0.95, Number((availWidth / 595).toFixed(2))));
    }
    return 1.0;
  });
  const [viewMode, setViewMode] = useState<'scroll' | 'flipbook'>('scroll');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });

  // Touch gesture tracking for swipe & pinch in flipbook mode
  const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });

  // Custom hooks for search
  const search = usePdfSearch(pdfDocument);

  // Responsive mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSpreadMode('single');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Precision Fit Scale Calculations (Fit Page & Fit Width)
  const calculateFitScale = useCallback(
    (mode: 'page' | 'width') => {
      const container = containerRef.current;
      if (!container || baseDimensions.width === 0 || baseDimensions.height === 0) return;

      const availWidth = Math.max(300, container.clientWidth - 48);
      const availHeight = Math.max(300, container.clientHeight - 130);

      if (viewMode === 'scroll') {
        if (mode === 'page') {
          const fitH = (availHeight - 20) / baseDimensions.height;
          const fitW = (availWidth - 20) / baseDimensions.width;
          const optimal = Math.min(fitH, fitW, 1.4);
          setScale(Math.max(0.4, Number(optimal.toFixed(2))));
        } else {
          const targetColWidth = Math.min(availWidth - 24, 920);
          const optimal = targetColWidth / baseDimensions.width;
          setScale(Math.max(0.4, Math.min(1.55, Number(optimal.toFixed(2)))));
        }
      } else {
        const isDouble = spreadMode === 'double' && !isMobile;
        const targetWidth = isDouble ? baseDimensions.width * 2 : baseDimensions.width;
        const targetHeight = baseDimensions.height;

        if (mode === 'page') {
          const scaleH = (availHeight - (isMobile ? 12 : 24)) / targetHeight;
          const scaleW = (availWidth - (isMobile ? 12 : 32)) / targetWidth;
          const optimal = Math.min(scaleH, scaleW, isMobile ? 1.05 : 1.2);
          setScale(Math.max(0.3, Number(optimal.toFixed(2))));
        } else {
          const optimal = (availWidth - (isMobile ? 12 : 32)) / targetWidth;
          setScale(Math.max(0.3, Math.min(isMobile ? 1.15 : 1.4, Number(optimal.toFixed(2)))));
        }
      }
    },
    [viewMode, spreadMode, isMobile, baseDimensions]
  );

  // Initial fit on load
  const hasInitializedScale = useRef(false);
  useEffect(() => {
    if (!hasInitializedScale.current && baseDimensions.width > 0) {
      hasInitializedScale.current = true;
      calculateFitScale('page');
    }
  }, [baseDimensions, viewMode, calculateFitScale]);

  // Smooth scroll helper for scroll mode
  const scrollToPage = (page: number) => {
    const el = document.getElementById(`page-container-${page}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Page Navigation Handlers
  const handleGoToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    scrollToPage(clamped);
  };

  const handleNextPage = useCallback(() => {
    const next = Math.min(currentPage + 1, totalPages);
    setCurrentPage(next);
    scrollToPage(next);
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    const prev = Math.max(currentPage - 1, 1);
    setCurrentPage(prev);
    scrollToPage(prev);
  }, [currentPage]);

  const handleFirstPage = () => handleGoToPage(1);
  const handleLastPage = () => handleGoToPage(totalPages);

  // Zoom Handlers
  const handleZoomIn = () => setScale(s => Math.min(Number((s + 0.15).toFixed(2)), 2.5));
  const handleZoomOut = () => setScale(s => Math.max(Number((s - 0.15).toFixed(2)), 0.4));
  const handleFitPage = () => calculateFitScale('page');
  const handleFitWidth = () => calculateFitScale('width');

  // Fullscreen Handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen change event
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'Escape') {
        setShowThumbnails(false);
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextPage, handlePrevPage]);

  // Touch Swipe for Flipbook mode
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode === 'scroll') return;
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        dist: 0,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (viewMode === 'scroll') return;
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 60) {
        if (deltaX < 0) {
          handleNextPage();
        } else {
          handlePrevPage();
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-screen bg-slate-950 text-slate-100 select-none overflow-hidden flex flex-col justify-between"
    >
      {/* Top and Bottom Controls Toolbar */}
      <PdfToolbar
        book={book}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        isFullscreen={isFullscreen}
        showThumbnails={showThumbnails}
        viewMode={viewMode}
        spreadMode={spreadMode}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onFirstPage={handleFirstPage}
        onLastPage={handleLastPage}
        onGoToPage={handleGoToPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleThumbnails={() => setShowThumbnails(v => !v)}
        onToggleSearch={() => setShowSearch(v => !v)}
        onToggleViewMode={() => setViewMode(m => (m === 'scroll' ? 'flipbook' : 'scroll'))}
        onToggleSpreadMode={() => setSpreadMode(m => (m === 'double' ? 'single' : 'double'))}
      />

      {/* Lazy Virtualized Thumbnails Sidebar */}
      <PdfThumbnails
        pdfDocument={pdfDocument}
        currentPage={currentPage}
        totalPages={totalPages}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
        onSelectPage={page => {
          handleGoToPage(page);
          if (isMobile) setShowThumbnails(false);
        }}
      />

      {/* In-Document Text Search Overlay */}
      <PdfSearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        query={search.query}
        results={search.results}
        currentResultIndex={search.currentResultIndex}
        searching={search.searching}
        searchProgress={search.searchProgress}
        onSearch={search.performSearch}
        onClear={search.clearSearch}
        onNext={search.nextResult}
        onPrev={search.prevResult}
        onSelectResult={search.selectResult}
        onGoToPage={handleGoToPage}
      />

      {/* Main Continuous Document Stage */}
      <main
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-auto pt-16 pb-24 px-2 sm:px-4 scrollbar-thin flex justify-center"
      >
        <div className="min-w-fit w-full flex flex-col items-center mx-auto my-4 max-w-fit shadow-2xl rounded-xl overflow-hidden border border-slate-800/80 bg-white">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <PdfScrollPage
              key={pageNum}
              pdfDocument={pdfDocument}
              pageNumber={pageNum}
              scale={scale}
              baseDimensions={baseDimensions}
              onVisible={p => setCurrentPage(p)}
              onDimensionsLoaded={dims => setBaseDimensions(dims)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};
