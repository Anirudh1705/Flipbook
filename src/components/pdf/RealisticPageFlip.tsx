import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfPageCanvas } from './PdfPageCanvas';
import { playPageTurnSound } from '../../lib/pageAudio';

export interface RealisticPageFlipHandle {
  flipNext: () => void;
  flipPrev: () => void;
  flipToPage: (page: number) => void;
}

interface RealisticPageFlipProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  totalPages: number;
  scale: number;
  isDual: boolean;
  baseDimensions: { width: number; height: number };
  onPageChange: (newPage: number) => void;
  onPageLoaded?: (dims: { width: number; height: number }) => void;
}

export const RealisticPageFlip = forwardRef<RealisticPageFlipHandle, RealisticPageFlipProps>(
  (
    {
      pdfDocument,
      currentPage,
      totalPages,
      scale,
      isDual,
      baseDimensions,
      onPageChange,
      onPageLoaded,
    },
    ref
  ) => {
    // Flip animation state
    const [isFlipping, setIsFlipping] = useState<boolean>(false);
    const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
    const [flipProgress, setFlipProgress] = useState<number>(0); // 0 to 1
    const [targetPage, setTargetPage] = useState<number>(currentPage);

    const animationFrameRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const FLIP_DURATION = 580; // ms for authentic page weight & feel

    // Trigger smooth forward page turn
    const flipNext = () => {
      if (isFlipping || currentPage >= totalPages) return;

      const nextTarget = isDual
        ? (currentPage === 1 ? 2 : Math.min(currentPage + 2, totalPages))
        : Math.min(currentPage + 1, totalPages);

      if (nextTarget === currentPage) return;

      playPageTurnSound();
      setFlipDirection('next');
      setTargetPage(nextTarget);
      setIsFlipping(true);
      setFlipProgress(0);
      startTimeRef.current = null;
    };

    // Trigger smooth backward page turn
    const flipPrev = () => {
      if (isFlipping || currentPage <= 1) return;

      const prevTarget = isDual
        ? (currentPage <= 3 ? 1 : Math.max(currentPage - 2, 2))
        : Math.max(currentPage - 1, 1);

      if (prevTarget === currentPage) return;

      playPageTurnSound();
      setFlipDirection('prev');
      setTargetPage(prevTarget);
      setIsFlipping(true);
      setFlipProgress(0);
      startTimeRef.current = null;
    };

    useImperativeHandle(
      ref,
      () => ({
        flipNext,
        flipPrev,
        flipToPage: (page: number) => {
          if (page === currentPage || isFlipping) return;
          if (page > currentPage) {
            playPageTurnSound();
            setFlipDirection('next');
            setTargetPage(page);
            setIsFlipping(true);
            setFlipProgress(0);
            startTimeRef.current = null;
          } else {
            playPageTurnSound();
            setFlipDirection('prev');
            setTargetPage(page);
            setIsFlipping(true);
            setFlipProgress(0);
            startTimeRef.current = null;
          }
        },
      }),
      [currentPage, totalPages, isDual, isFlipping]
    );

  // 60FPS Hardware-accelerated 3D transform progression
  useEffect(() => {
    if (!isFlipping || !flipDirection) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = Math.min(elapsed / FLIP_DURATION, 1);

      // Smooth cubic-bezier page turn easing (realistic paper lift and fall)
      // Ease in-out with natural gravitational landing
      const easedProgress =
        rawProgress < 0.5
          ? 4 * rawProgress * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      setFlipProgress(easedProgress);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Complete flip
        setIsFlipping(false);
        setFlipDirection(null);
        setFlipProgress(0);
        onPageChange(targetPage);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isFlipping, flipDirection, targetPage, onPageChange]);

  const pageWidth = Math.floor(baseDimensions.width * scale);
  const pageHeight = Math.floor(baseDimensions.height * scale);

  // DUAL SPREAD CALCULATIONS
  if (isDual) {
    const leftPage = currentPage === 1 ? 1 : currentPage;
    const rightPage = currentPage === 1 ? null : (currentPage + 1 <= totalPages ? currentPage + 1 : null);

    // Forward flip pages:
    // Underneath Left: leftPage
    // Underneath Right: targetPage + 1
    // Flipping Front: rightPage
    // Flipping Back: targetPage (left side of next spread)
    const forwardUnderneathLeft = leftPage;
    const forwardUnderneathRight = targetPage + 1 <= totalPages ? targetPage + 1 : null;
    const forwardFlippingFront = rightPage || leftPage;
    const forwardFlippingBack = targetPage;

    // Backward flip pages:
    // Underneath Left: targetPage
    // Underneath Right: rightPage
    // Flipping Front: leftPage
    // Flipping Back: targetPage === 1 ? 1 : targetPage + 1
    const backwardUnderneathLeft = targetPage;
    const backwardUnderneathRight = rightPage;
    const backwardFlippingFront = leftPage;
    const backwardFlippingBack = targetPage === 1 ? 1 : targetPage + 1;

    // Rotation angles
    const forwardAngle = -180 * flipProgress;
    const backwardAngle = 180 * flipProgress;

    // Dynamic shadow opacity (peaks at 90deg when page is vertical)
    const shadowOpacity = Math.sin(flipProgress * Math.PI) * 0.45;

    return (
      <div className="perspective-2000 relative flex items-center justify-center select-none">
        {/* The Book Spread Canvas Container */}
        <div
          className="relative flex items-center shadow-2xl rounded-xl overflow-visible border border-slate-800/80 bg-slate-900"
          style={{
            width: `${pageWidth * 2}px`,
            height: `${pageHeight}px`,
          }}
        >
          {/* STATIC BASE (When not flipping) */}
          {!isFlipping && (
            <>
              {/* Left Page */}
              <div
                onClick={flipPrev}
                className="relative cursor-pointer group"
                style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                title="Click left to turn page backward"
              >
                {currentPage === 1 ? (
                  <div
                    className="bg-slate-950 flex items-center justify-center text-slate-700 font-mono text-xs border-r border-slate-900"
                    style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                  >
                    Inside Front Cover
                  </div>
                ) : (
                  <>
                    <PdfPageCanvas
                      pdfDocument={pdfDocument}
                      pageNumber={leftPage}
                      scale={scale}
                      side="left"
                      onPageLoaded={onPageLoaded}
                    />
                    <div className="page-corner-curl-left group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all" />
                  </>
                )}
              </div>

              {/* Book Spine 3D Crease */}
              <div className="w-6 h-full absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none book-spine-gradient" />

              {/* Right Page */}
              <div
                onClick={flipNext}
                className="relative cursor-pointer group"
                style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                title="Click right to turn page forward"
              >
                {currentPage === 1 ? (
                  <>
                    <PdfPageCanvas
                      pdfDocument={pdfDocument}
                      pageNumber={1}
                      scale={scale}
                      side="single"
                      onPageLoaded={onPageLoaded}
                    />
                    <div className="page-corner-curl-right group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all" />
                  </>
                ) : rightPage ? (
                  <>
                    <PdfPageCanvas
                      pdfDocument={pdfDocument}
                      pageNumber={rightPage}
                      scale={scale}
                      side="right"
                      onPageLoaded={onPageLoaded}
                    />
                    <div className="page-corner-curl-right group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all" />
                  </>
                ) : (
                  <div
                    className="bg-slate-950 flex items-center justify-center text-slate-700 font-mono text-xs border-l border-slate-900"
                    style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                  >
                    End of Publication
                  </div>
                )}
              </div>
            </>
          )}

          {/* ACTIVE 3D FORWARD FLIP */}
          {isFlipping && flipDirection === 'next' && (
            <>
              {/* Left Underneath Page */}
              <div
                className="relative"
                style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
              >
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={forwardUnderneathLeft}
                  scale={scale}
                  side="left"
                />
                {/* Cast shadow on left page as turning leaf approaches */}
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: flipProgress > 0.5 ? shadowOpacity : 0 }}
                />
              </div>

              {/* Spine 3D Crease */}
              <div className="w-6 h-full absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none book-spine-gradient" />

              {/* Right Underneath Page (Destined next page) */}
              <div
                className="relative"
                style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
              >
                {forwardUnderneathRight ? (
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={forwardUnderneathRight}
                    scale={scale}
                    side="right"
                  />
                ) : (
                  <div
                    className="bg-slate-950 flex items-center justify-center text-slate-700 font-mono text-xs border-l border-slate-900"
                    style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                  >
                    End of Publication
                  </div>
                )}
                {/* Cast shadow on right page as turning leaf lifts */}
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: flipProgress <= 0.5 ? shadowOpacity : 0 }}
                />
              </div>

              {/* The 3D Turning Leaf */}
              <div
                className="absolute top-0 right-0 z-40 transform-style-preserve-3d"
                style={{
                  width: `${pageWidth}px`,
                  height: `${pageHeight}px`,
                  transformOrigin: 'left center',
                  transform: `rotateY(${forwardAngle}deg)`,
                }}
              >
                {/* Leaf Front (Showing current right page) */}
                <div className="absolute inset-0 backface-hidden page-shadow-right bg-white overflow-hidden rounded-r-lg">
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={forwardFlippingFront}
                    scale={scale}
                    side="right"
                  />
                  {/* Dynamic Lighting highlight */}
                  <div
                    className="absolute inset-0 page-lighting-right-to-left pointer-events-none"
                    style={{ opacity: shadowOpacity * 1.5 }}
                  />
                </div>

                {/* Leaf Back (Showing target left page, flipped upright) */}
                <div
                  className="absolute inset-0 backface-hidden page-shadow-left bg-white overflow-hidden rounded-l-lg transform-rotate-y-180"
                >
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={forwardFlippingBack}
                    scale={scale}
                    side="left"
                  />
                  {/* Dynamic Lighting highlight */}
                  <div
                    className="absolute inset-0 page-lighting-left-to-right pointer-events-none"
                    style={{ opacity: shadowOpacity * 1.5 }}
                  />
                </div>
              </div>
            </>
          )}

          {/* ACTIVE 3D BACKWARD FLIP */}
          {isFlipping && flipDirection === 'prev' && (
            <>
              {/* Left Underneath Page */}
              <div
                className="relative"
                style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
              >
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={backwardUnderneathLeft}
                  scale={scale}
                  side="left"
                />
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: flipProgress <= 0.5 ? shadowOpacity : 0 }}
                />
              </div>

              {/* Spine 3D Crease */}
              <div className="w-6 h-full absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none book-spine-gradient" />

              {/* Right Underneath Page */}
              <div
                className="relative"
                style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
              >
                {backwardUnderneathRight ? (
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={backwardUnderneathRight}
                    scale={scale}
                    side="right"
                  />
                ) : (
                  <div
                    className="bg-slate-950 flex items-center justify-center text-slate-700 font-mono text-xs border-l border-slate-900"
                    style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
                  >
                    End of Publication
                  </div>
                )}
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: flipProgress > 0.5 ? shadowOpacity : 0 }}
                />
              </div>

              {/* The 3D Turning Leaf (Starts from Left) */}
              <div
                className="absolute top-0 left-0 z-40 transform-style-preserve-3d"
                style={{
                  width: `${pageWidth}px`,
                  height: `${pageHeight}px`,
                  transformOrigin: 'right center',
                  transform: `rotateY(${backwardAngle}deg)`,
                }}
              >
                {/* Leaf Front (Showing current left page) */}
                <div className="absolute inset-0 backface-hidden page-shadow-left bg-white overflow-hidden rounded-l-lg">
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={backwardFlippingFront}
                    scale={scale}
                    side="left"
                  />
                  <div
                    className="absolute inset-0 page-lighting-left-to-right pointer-events-none"
                    style={{ opacity: shadowOpacity * 1.5 }}
                  />
                </div>

                {/* Leaf Back (Showing target right page, flipped upright) */}
                <div
                  className="absolute inset-0 backface-hidden page-shadow-right bg-white overflow-hidden rounded-r-lg transform-rotate-y-180"
                >
                  <PdfPageCanvas
                    pdfDocument={pdfDocument}
                    pageNumber={backwardFlippingBack}
                    scale={scale}
                    side="right"
                  />
                  <div
                    className="absolute inset-0 page-lighting-right-to-left pointer-events-none"
                    style={{ opacity: shadowOpacity * 1.5 }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // SINGLE PAGE MODE (Mobile / Tablet)
  const singleForwardAngle = -180 * flipProgress;
  const singleBackwardAngle = 180 * flipProgress;
  const singleShadow = Math.sin(flipProgress * Math.PI) * 0.4;

  return (
    <div className="perspective-1000 relative flex items-center justify-center select-none">
      <div
        className="relative shadow-2xl rounded-xl overflow-visible border border-slate-800/80 bg-slate-900"
        style={{
          width: `${pageWidth}px`,
          height: `${pageHeight}px`,
        }}
      >
        {/* Non-flipping state */}
        {!isFlipping && (
          <div
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isRightSide = e.clientX - rect.left > rect.width / 2;
              if (isRightSide) flipNext();
              else flipPrev();
            }}
            className="relative cursor-pointer group"
            style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
          >
            <PdfPageCanvas
              pdfDocument={pdfDocument}
              pageNumber={currentPage}
              scale={scale}
              side="single"
              onPageLoaded={onPageLoaded}
            />
            {currentPage < totalPages && (
              <div className="page-corner-curl-right group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all" />
            )}
            {currentPage > 1 && (
              <div className="page-corner-curl-left group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all" />
            )}
          </div>
        )}

        {/* Single Page Active Flip */}
        {isFlipping && flipDirection === 'next' && (
          <>
            {/* Target Page Underneath */}
            <div className="absolute inset-0">
              <PdfPageCanvas
                pdfDocument={pdfDocument}
                pageNumber={targetPage}
                scale={scale}
                side="single"
              />
            </div>

            {/* Turning Leaf */}
            <div
              className="absolute inset-0 transform-style-preserve-3d"
              style={{
                transformOrigin: 'left center',
                transform: `rotateY(${singleForwardAngle}deg)`,
              }}
            >
              <div className="absolute inset-0 backface-hidden bg-white shadow-2xl overflow-hidden rounded-xl">
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={currentPage}
                  scale={scale}
                  side="single"
                />
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: singleShadow }}
                />
              </div>
              <div className="absolute inset-0 backface-hidden bg-white shadow-2xl overflow-hidden rounded-xl transform-rotate-y-180">
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={targetPage}
                  scale={scale}
                  side="single"
                />
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: singleShadow }}
                />
              </div>
            </div>
          </>
        )}

        {isFlipping && flipDirection === 'prev' && (
          <>
            {/* Target Page Underneath */}
            <div className="absolute inset-0">
              <PdfPageCanvas
                pdfDocument={pdfDocument}
                pageNumber={targetPage}
                scale={scale}
                side="single"
              />
            </div>

            {/* Turning Leaf */}
            <div
              className="absolute inset-0 transform-style-preserve-3d"
              style={{
                transformOrigin: 'right center',
                transform: `rotateY(${singleBackwardAngle}deg)`,
              }}
            >
              <div className="absolute inset-0 backface-hidden bg-white shadow-2xl overflow-hidden rounded-xl">
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={currentPage}
                  scale={scale}
                  side="single"
                />
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: singleShadow }}
                />
              </div>
              <div className="absolute inset-0 backface-hidden bg-white shadow-2xl overflow-hidden rounded-xl transform-rotate-y-180">
                <PdfPageCanvas
                  pdfDocument={pdfDocument}
                  pageNumber={targetPage}
                  scale={scale}
                  side="single"
                />
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: singleShadow }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
);

RealisticPageFlip.displayName = 'RealisticPageFlip';
