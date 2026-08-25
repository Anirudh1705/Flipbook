import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPageCanvas } from './PdfPageCanvas';
import { playPageTurnSound } from '../../lib/pageAudio';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [isFlipping, setIsFlipping] = useState<'forward' | 'backward' | null>(null);
    const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

    // Responsive mobile detector
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine left and right page numbers in book spread
    // Page 1 is the front cover (single right page on desktop, single page on mobile)
    let leftPageNum: number | null = null;
    let rightPageNum: number | null = null;

    if (isMobile) {
      rightPageNum = currentPage;
    } else {
      if (currentPage === 1) {
        leftPageNum = null;
        rightPageNum = 1;
      } else if (currentPage >= totalPages && totalPages % 2 === 0) {
        leftPageNum = totalPages;
        rightPageNum = null;
      } else {
        const evenLeft = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        leftPageNum = evenLeft <= totalPages ? evenLeft : null;
        rightPageNum = evenLeft + 1 <= totalPages ? evenLeft + 1 : null;
      }
    }

    const goToNext = useCallback(() => {
      if (isFlipping) return;
      const step = isMobile || currentPage === 1 ? 1 : 2;
      const nextP = Math.min(totalPages, currentPage + step);
      if (nextP !== currentPage) {
        setIsFlipping('forward');
        playPageTurnSound();
        setTimeout(() => {
          onPageChange(nextP);
          setIsFlipping(null);
        }, 320);
      }
    }, [isFlipping, isMobile, currentPage, totalPages, onPageChange]);

    const goToPrev = useCallback(() => {
      if (isFlipping) return;
      const step = isMobile || currentPage <= 2 ? 1 : 2;
      const prevP = Math.max(1, currentPage - step);
      if (prevP !== currentPage) {
        setIsFlipping('backward');
        playPageTurnSound();
        setTimeout(() => {
          onPageChange(prevP);
          setIsFlipping(null);
        }, 320);
      }
    }, [isFlipping, isMobile, currentPage, onPageChange]);

    // Expose control methods to parent toolbar
    useImperativeHandle(
      ref,
      () => ({
        flipNext: goToNext,
        flipPrev: goToPrev,
        flipToPage: (page: number) => {
          if (page >= 1 && page <= totalPages && page !== currentPage) {
            playPageTurnSound();
            onPageChange(page);
          }
        },
      }),
      [goToNext, goToPrev, totalPages, currentPage, onPageChange]
    );

    // Keyboard Arrow Navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
          goToNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          goToPrev();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev]);

    // Touch Swipe Gesture Tracking for Mobile
    const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
        if (Math.abs(deltaX) > 40 && deltaY < 80) {
          if (deltaX < 0) {
            goToNext();
          } else {
            goToPrev();
          }
        }
      }
    };

    return (
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full flex items-center justify-center select-none overflow-visible p-2 sm:p-6 perspective-2000"
      >
        {/* Previous Page Navigation Button */}
        {currentPage > 1 && (
          <button
            onClick={goToPrev}
            className="absolute left-2 sm:left-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* 3D Book Spread Shell */}
        <div
          className={`relative flex items-center justify-center transition-transform duration-300 ${
            isFlipping === 'forward'
              ? 'scale-[0.99] rotate-y-[-2deg]'
              : isFlipping === 'backward'
              ? 'scale-[0.99] rotate-y-[2deg]'
              : 'scale-100'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Left Page (Desktop Spread) */}
          {!isMobile && (
            <div
              className={`relative bg-white shadow-2xl overflow-hidden transition-all duration-300 rounded-l-md border-r border-slate-200/50 ${
                leftPageNum ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                boxShadow: leftPageNum ? '-12px 18px 35px -8px rgba(0, 0, 0, 0.65)' : 'none',
              }}
            >
              {leftPageNum ? (
                <>
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={leftPageNum}
                    scale={scale}
                    side="left"
                    onPageLoaded={onDimensionsLoaded}
                  />
                  {/* Spine Depth Lighting Gradient */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/25 via-black/5 to-transparent pointer-events-none" />
                </>
              ) : (
                <div
                  style={{
                    width: `${Math.floor(baseDimensions.width * scale)}px`,
                    height: `${Math.floor(baseDimensions.height * scale)}px`,
                  }}
                />
              )}
            </div>
          )}

          {/* Center Book Spine Divider on Spreads */}
          {!isMobile && leftPageNum && rightPageNum && (
            <div className="w-[2px] self-stretch bg-slate-400/40 z-20 shadow-md" />
          )}

          {/* Right Page (Desktop & Mobile Single View) */}
          <div
            className={`relative bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
              isMobile ? 'rounded-md shadow-2xl' : 'rounded-r-md'
            } ${rightPageNum ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            style={{
              boxShadow: isMobile
                ? '0 20px 40px -10px rgba(0, 0, 0, 0.7)'
                : '12px 18px 35px -8px rgba(0, 0, 0, 0.65)',
            }}
          >
            {rightPageNum ? (
              <>
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={rightPageNum}
                  scale={scale}
                  side={isMobile ? 'single' : 'right'}
                  onPageLoaded={onDimensionsLoaded}
                />
                {/* Spine Depth Lighting Gradient on Desktop */}
                {!isMobile && (
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/25 via-black/5 to-transparent pointer-events-none" />
                )}
              </>
            ) : (
              <div
                style={{
                  width: `${Math.floor(baseDimensions.width * scale)}px`,
                  height: `${Math.floor(baseDimensions.height * scale)}px`,
                }}
              />
            )}
          </div>
        </div>

        {/* Next Page Navigation Button */}
        {currentPage < totalPages && (
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-6 z-30 p-2.5 sm:p-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
            title="Next Page (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    );
  }
);

TurnFlipbook.displayName = 'TurnFlipbook';
