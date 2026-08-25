import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Book } from '../../types/book';
import { PdfScrollPage } from './PdfScrollPage';
import { RealisticPageFlip } from './RealisticPageFlip';
import { PdfToolbar } from './PdfToolbar';
import { PdfThumbnails } from './PdfThumbnails';
import { PdfSearchModal } from './PdfSearchModal';
import { ResumePrompt } from './ResumePrompt';
import { usePdfSearch } from '../../hooks/usePdfSearch';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FlipbookViewerProps {
  book: Book;
  pdfDocument: PDFDocumentProxy;
}

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({ book, pdfDocument }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const totalPages = pdfDocument.numPages;

  // Viewport & Layout state - Defaults to interactive 3D Flipbook mode
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'scroll' | 'flipbook'>('flipbook');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [spreadMode, setSpreadMode] = useState<'single' | 'double'>('double');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });

  // Touch gesture tracking for swipe & pinch in flipbook mode
  const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });

  // Custom hooks for search and reading memory
  const search = usePdfSearch(pdfDocument);
  const { savedProgress, updateProgress, dismissPrompt } = useReadingProgress(book.slug);

  // Detect mobile screen & adjust spread mode
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

  // Sync reading progress
  useEffect(() => {
    updateProgress(currentPage, totalPages);
  }, [currentPage, totalPages, updateProgress]);

  // Precision Fit Scale Calculations (Fit Page & Fit Width)
  const calculateFitScale = useCallback(
    (mode: 'page' | 'width') => {
      const container = containerRef.current;
      if (!container || baseDimensions.width === 0 || baseDimensions.height === 0) return;

      const availWidth = Math.max(300, container.clientWidth - 48);
      const availHeight = Math.max(300, container.clientHeight - 130); // account for top header & bottom bar

      if (viewMode === 'scroll') {
        if (mode === 'page') {
          // Fit Page: Entire page height fits cleanly inside viewport
          const fitH = (availHeight - 20) / baseDimensions.height;
          const fitW = (availWidth - 20) / baseDimensions.width;
          const optimal = Math.min(fitH, fitW, 1.4);
          setScale(Math.max(0.4, Number(optimal.toFixed(2))));
        } else {
          // Fit Width: Fills container width comfortably up to max readable column width (~920px)
          const targetColWidth = Math.min(availWidth - 24, 920);
          const optimal = targetColWidth / baseDimensions.width;
          setScale(Math.max(0.4, Math.min(1.55, Number(optimal.toFixed(2)))));
        }
      } else {
        const isDouble = spreadMode === 'double' && !isMobile && currentPage > 1;
        const targetWidth = isDouble ? baseDimensions.width * 2 : baseDimensions.width;
        const targetHeight = baseDimensions.height;

        if (mode === 'page') {
          // Fit Page: Fits the entire spread cleanly in view
          const scaleH = (availHeight - 20) / targetHeight;
          const scaleW = (availWidth - 20) / targetWidth;
          const optimal = Math.min(scaleH, scaleW, 1.4);
          setScale(Math.max(0.4, Number(optimal.toFixed(2))));
        } else {
          // Fit Width: Fits spread to container width
          const optimal = (availWidth - 32) / targetWidth;
          setScale(Math.max(0.4, Math.min(1.6, Number(optimal.toFixed(2)))));
        }
      }
    },
    [viewMode, spreadMode, isMobile, currentPage, baseDimensions]
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
    if (viewMode === 'scroll') {
      scrollToPage(clamped);
    } else {
      if (spreadMode === 'double' && !isMobile && clamped > 1 && clamped % 2 === 1) {
        setCurrentPage(clamped - 1);
      }
    }
  };

  const handleNextPage = useCallback(() => {
    if (viewMode === 'scroll') {
      const next = Math.min(currentPage + 1, totalPages);
      setCurrentPage(next);
      scrollToPage(next);
    } else {
      if (spreadMode === 'double' && !isMobile) {
        if (currentPage === 1) {
          setCurrentPage(2);
        } else {
          setCurrentPage(prev => Math.min(prev + 2, totalPages));
        }
      } else {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
      }
    }
  }, [viewMode, spreadMode, isMobile, currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (viewMode === 'scroll') {
      const prev = Math.max(currentPage - 1, 1);
      setCurrentPage(prev);
      scrollToPage(prev);
    } else {
      if (spreadMode === 'double' && !isMobile) {
        if (currentPage <= 3) {
          setCurrentPage(1);
        } else {
          setCurrentPage(p => Math.max(p - 2, 2));
        }
      } else {
        setCurrentPage(p => Math.max(p - 1, 1));
      }
    }
  }, [viewMode, spreadMode, isMobile, currentPage]);

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
      {/* Resume Progress Toast */}
      {savedProgress && (
        <ResumePrompt
          progress={savedProgress}
          onResume={page => {
            handleGoToPage(page);
            dismissPrompt();
          }}
          onDismiss={dismissPrompt}
        />
      )}

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

      {/* Main Viewport Stage */}
      {viewMode === 'scroll' ? (
        /* 1. CONTINUOUS VERTICAL SCROLL MODE */
        <main
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-y-auto overflow-x-auto pt-16 pb-24 px-4 scrollbar-thin"
        >
          <div className="min-w-fit w-full flex flex-col items-center mx-auto">
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
      ) : (
        /* 2. PAGINATED / DUAL SPREAD 3D FLIPBOOK MODE */
        <main className="flex-1 w-full overflow-auto flex items-center justify-center p-4 sm:p-8 pt-16 pb-20 relative">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="hidden lg:flex absolute left-4 z-30 w-12 h-12 rounded-2xl bg-slate-900/70 hover:bg-brand-500 text-slate-300 hover:text-slate-950 items-center justify-center border border-slate-800 backdrop-blur-md shadow-xl disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-105 active:scale-95"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="hidden lg:flex absolute right-4 z-30 w-12 h-12 rounded-2xl bg-slate-900/70 hover:bg-brand-500 text-slate-300 hover:text-slate-950 items-center justify-center border border-slate-800 backdrop-blur-md shadow-xl disabled:opacity-0 disabled:pointer-events-none transition-all hover:scale-105 active:scale-95"
            title="Next Page (Right Arrow / Space)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <RealisticPageFlip
            pdfDocument={pdfDocument}
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            isDual={spreadMode === 'double' && !isMobile}
            baseDimensions={baseDimensions}
            onPageChange={newPage => setCurrentPage(newPage)}
            onPageLoaded={dims => setBaseDimensions(dims)}
          />
        </main>
      )}
    </div>
  );
};
