import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Search,
  BookOpen,
  Columns2,
  Square,
  Sparkles,
  Rows3,
  BookMarked,
  Layers,
} from 'lucide-react';
import type { Book } from '../../types/book';

interface PdfToolbarProps {
  book: Book;
  currentPage: number;
  totalPages: number;
  scale: number;
  isFullscreen: boolean;
  showThumbnails: boolean;
  viewMode: 'scroll' | 'flipbook';
  spreadMode: 'single' | 'double';
  onPrevPage: () => void;
  onNextPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onToggleFullscreen: () => void;
  onToggleThumbnails: () => void;
  onToggleSearch: () => void;
  onToggleViewMode: () => void;
  onToggleSpreadMode: () => void;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  book,
  currentPage,
  totalPages,
  scale,
  isFullscreen,
  showThumbnails,
  viewMode,
  spreadMode,
  onPrevPage,
  onNextPage,
  onFirstPage,
  onLastPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onToggleFullscreen,
  onToggleThumbnails,
  onToggleSearch,
  onToggleViewMode,
  onToggleSpreadMode,
}) => {
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showJumpDialog, setShowJumpDialog] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('flipbook_admin_authenticated') === 'true');
  }, []);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      onGoToPage(target);
      setShowJumpDialog(false);
      setJumpInput('');
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 h-14 glass-toolbar border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between shadow-lg">
        {/* Left: Brand / Admin Access */}
        <div className="flex items-center gap-3 min-w-0">
          {isAdmin ? (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30 transition-colors"
              title="Return to Admin Dashboard"
            >
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="hidden sm:inline">Admin Hub</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs tracking-wide">
              <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <Layers className="w-4 h-4 text-brand-400" />
              </div>
              <span className="hidden sm:inline text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                Digital Edition
              </span>
            </div>
          )}

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Publication Title */}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[180px] sm:max-w-md">
              {book.title}
            </h1>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Continuous Scroll vs Flipbook Mode Switcher */}
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-xs font-medium border border-slate-800 text-brand-400 transition-colors"
            title={viewMode === 'scroll' ? 'Switch to Flipbook Spread View' : 'Switch to Continuous Scroll View'}
          >
            {viewMode === 'scroll' ? (
              <>
                <Rows3 className="w-4 h-4" />
                <span className="hidden lg:inline text-[11px]">Continuous Scroll</span>
              </>
            ) : (
              <>
                <BookMarked className="w-4 h-4" />
                <span className="hidden lg:inline text-[11px]">Book Spread</span>
              </>
            )}
          </button>

          {/* Spread Mode Toggle (Only in Flipbook mode on Desktop) */}
          {viewMode === 'flipbook' && (
            <button
              onClick={onToggleSpreadMode}
              className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
              title={spreadMode === 'double' ? 'Switch to Single Page View' : 'Switch to Dual Spread View'}
              aria-label="Toggle Page Spread View"
            >
              {spreadMode === 'double' ? <Columns2 className="w-4 h-4 text-brand-400" /> : <Square className="w-4 h-4" />}
            </button>
          )}

          {/* Thumbnails Toggle */}
          <button
            onClick={onToggleThumbnails}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              showThumbnails
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
            title="Toggle Thumbnails Panel"
            aria-label="Toggle Thumbnails Panel"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Search in Document */}
          <button
            onClick={onToggleSearch}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
            title="Search Text in Publication (Ctrl+F)"
            aria-label="Search Text in Publication"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen (F)'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Developed by Anirudh */}
          <a
            href="https://www.linkedin.com/in/anirudh8760/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-[11px] font-mono text-slate-400 hover:text-brand-400 transition-colors"
            title="Developed by Anirudh"
          >
            <span>Dev:</span>
            <span className="text-slate-200 font-semibold underline underline-offset-2">Anirudh</span>
          </a>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[94%] sm:w-auto">
        <div className="glass-toolbar rounded-2xl p-1.5 sm:p-2 border border-slate-800 shadow-2xl flex items-center justify-between sm:justify-center gap-1 sm:gap-3 text-xs text-slate-300">
          {/* First & Previous Page */}
          <div className="flex items-center gap-1">
            <button
              onClick={onFirstPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="First Page"
              aria-label="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onPrevPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Page (←)"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Page Counter & Direct Jump Trigger */}
          <button
            onClick={() => setShowJumpDialog(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-850 text-slate-200 font-mono text-xs flex items-center gap-1.5 transition-all"
            title="Click to Jump to Specific Page"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-400" />
            <span>
              Page <strong className="text-white">{currentPage}</strong> / {totalPages || 1}
            </span>
          </button>

          {/* Next & Last Page */}
          <div className="flex items-center gap-1">
            <button
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Page (→)"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLastPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Last Page"
              aria-label="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={onZoomOut}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 w-10 text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Fit Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={onFitPage}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-medium border border-slate-800 hover:bg-slate-850 transition-colors"
              title="Fit to Page Height"
            >
              Fit Page
            </button>
            <button
              onClick={onFitWidth}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 text-[11px] font-medium border border-slate-800 hover:bg-slate-850 transition-colors"
              title="Fit to Container Width"
            >
              Fit Width
            </button>
          </div>
        </div>
      </div>

      {/* Jump to Page Modal Dialog */}
      {showJumpDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-brand-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Go to Specific Page</span>
            </div>
            <p className="text-xs text-slate-400">
              Enter a page number between 1 and {totalPages}
            </p>

            <form onSubmit={handleJumpSubmit} className="space-y-3">
              <input
                type="number"
                min={1}
                max={totalPages}
                autoFocus
                value={jumpInput}
                onChange={e => setJumpInput(e.target.value)}
                placeholder={String(currentPage)}
                className="w-full text-center py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-lg font-mono font-bold text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJumpDialog(false)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition-colors"
                >
                  Jump
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
