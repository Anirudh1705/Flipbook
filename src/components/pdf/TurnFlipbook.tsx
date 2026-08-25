import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPageCanvas } from './PdfPageCanvas';
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
        }, 360);
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
        }, 360);
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
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
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
        if (Math.abs(deltaX) > 35 && deltaY < 90) {
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
        {/* 3D Book Spread Shell */}
        <div
          className="relative flex items-center justify-center transition-all duration-300"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Left Page (Desktop Spread) */}
          {!isMobile && (
            <div
              onClick={currentPage > 1 ? goToPrev : undefined}
              className={`relative bg-white shadow-2xl overflow-hidden transition-all duration-300 rounded-l-md border-r border-slate-200/50 group ${
                leftPageNum ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'
              } ${isFlipping === 'backward' ? 'page-flip-animate-backward' : ''}`}
              style={{
                boxShadow: leftPageNum ? '-14px 20px 40px -8px rgba(0, 0, 0, 0.7)' : 'none',
              }}
              title={leftPageNum ? 'Click to flip backward' : undefined}
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
                  <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/30 via-black/5 to-transparent pointer-events-none" />
                  {/* Subtle Corner Turn Cue on Hover */}
                  <div className="page-corner-curl-left opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <div className="w-[3px] self-stretch bg-slate-500/30 z-20 shadow-md" />
          )}

          {/* Right Page (Desktop & Mobile Single View) */}
          <div
            onClick={currentPage < totalPages ? goToNext : undefined}
            className={`relative bg-white shadow-2xl overflow-hidden transition-all duration-300 group ${
              isMobile ? 'rounded-md shadow-2xl' : 'rounded-r-md'
            } ${rightPageNum ? 'opacity-100 cursor-pointer' : 'opacity-0 pointer-events-none'} ${
              isFlipping === 'forward' ? 'page-flip-animate-forward' : ''
            }`}
            style={{
              boxShadow: isMobile
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                : '14px 20px 40px -8px rgba(0, 0, 0, 0.7)',
            }}
            title={rightPageNum && currentPage < totalPages ? 'Click to flip forward' : undefined}
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
                  <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/30 via-black/5 to-transparent pointer-events-none" />
                )}
                {/* Corner Turn Cue on Hover / Tap */}
                {currentPage < totalPages && (
                  <div className="page-corner-curl-right opacity-40 group-hover:opacity-100 transition-opacity" />
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
      </div>
    );
  }
);

TurnFlipbook.displayName = 'TurnFlipbook';
