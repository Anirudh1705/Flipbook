import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Book } from '../../types/book';
import { TurnFlipbook, type TurnFlipbookHandle } from './TurnFlipbook';
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
  const turnFlipbookRef = useRef<TurnFlipbookHandle | null>(null);
  const totalPages = pdfDocument.numPages;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number }>({
    width: 595,
    height: 842,
  });

  const search = usePdfSearch(pdfDocument);

  // Page Navigation Handlers
  const handleGoToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clamped);
    turnFlipbookRef.current?.flipToPage(clamped);
  };

  const handleNextPage = useCallback(() => {
    turnFlipbookRef.current?.flipNext();
  }, []);

  const handlePrevPage = useCallback(() => {
    turnFlipbookRef.current?.flipPrev();
  }, []);

  const handleFirstPage = () => handleGoToPage(1);
  const handleLastPage = () => handleGoToPage(totalPages);

  // Zoom Handlers
  const handleZoomIn = () => setScale(s => Math.min(Number((s + 0.15).toFixed(2)), 2.0));
  const handleZoomOut = () => setScale(s => Math.max(Number((s - 0.15).toFixed(2)), 0.6));
  const handleFitPage = () => setScale(1.0);
  const handleFitWidth = () => setScale(1.2);

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
        <TurnFlipbook
          ref={turnFlipbookRef}
          pdfDocument={pdfDocument}
          currentPage={currentPage}
          totalPages={totalPages}
          scale={scale}
          baseDimensions={baseDimensions}
          onPageChange={newPage => setCurrentPage(newPage)}
          onDimensionsLoaded={dims => setBaseDimensions(dims)}
        />
      </main>
    </div>
  );
};
