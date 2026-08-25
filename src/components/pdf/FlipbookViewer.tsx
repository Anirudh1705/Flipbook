import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Book } from '../../types/book';
import { RealisticPageFlip, type RealisticPageFlipHandle } from './RealisticPageFlip';
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
  const pageFlipRef = useRef<RealisticPageFlipHandle | null>(null);
  const totalPages = pdfDocument.numPages;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [scale, setScale] = useState<number>(0.9);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });

  const search = usePdfSearch(pdfDocument);

  // Responsive mobile and auto-scale calculations
  const calculateFitScale = useCallback(() => {
    const container = containerRef.current;
    if (!container || baseDimensions.width === 0 || baseDimensions.height === 0) return;

    const isMobileView = window.innerWidth < 768;
    setIsMobile(isMobileView);

    const availWidth = Math.max(280, container.clientWidth - (isMobileView ? 24 : 64));
    const availHeight = Math.max(300, container.clientHeight - (isMobileView ? 110 : 140));

    if (isMobileView) {
      const fitW = availWidth / baseDimensions.width;
      const fitH = availHeight / baseDimensions.height;
      const optimal = Math.min(fitW, fitH, 1.1);
      setScale(Math.max(0.35, Number(optimal.toFixed(2))));
    } else {
      // 2-page spread on desktop
      const fitW = availWidth / (baseDimensions.width * 2);
      const fitH = availHeight / baseDimensions.height;
      const optimal = Math.min(fitW, fitH, 1.3);
      setScale(Math.max(0.4, Number(optimal.toFixed(2))));
    }
  }, [baseDimensions]);

  useEffect(() => {
    calculateFitScale();
    const handleResize = () => {
      calculateFitScale();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFitScale]);

  // Page Navigation Handlers
  const handleGoToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    pageFlipRef.current?.flipToPage(clamped);
  };

  const handleNextPage = useCallback(() => {
    pageFlipRef.current?.flipNext();
  }, []);

  const handlePrevPage = useCallback(() => {
    pageFlipRef.current?.flipPrev();
  }, []);

  const handleFirstPage = () => handleGoToPage(1);
  const handleLastPage = () => handleGoToPage(totalPages);

  // Zoom Handlers
  const handleZoomIn = () => setScale(s => Math.min(Number((s + 0.15).toFixed(2)), 2.0));
  const handleZoomOut = () => setScale(s => Math.max(Number((s - 0.15).toFixed(2)), 0.4));
  const handleFitPage = () => calculateFitScale();
  const handleFitWidth = () => setScale(s => Number((s * 1.2).toFixed(2)));

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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-slate-950 text-slate-100 overflow-hidden flex flex-col justify-between"
    >
      {/* Top and Bottom Controls Toolbar */}
      <PdfToolbar
        book={book}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        isFullscreen={isFullscreen}
        showThumbnails={showThumbnails}
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
          setShowThumbnails(false);
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

      {/* Main 3D Realistic Page-Flipping Stage */}
      <main className="flex-1 min-h-0 w-full h-full relative flex items-center justify-center pt-14 pb-16 sm:pb-20 overflow-hidden">
        <RealisticPageFlip
          ref={pageFlipRef}
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          isDual={!isMobile}
          baseDimensions={baseDimensions}
          onPageChange={newPage => setCurrentPage(newPage)}
          onPageLoaded={dims => setBaseDimensions(dims)}
        />
      </main>
    </div>
  );
};
