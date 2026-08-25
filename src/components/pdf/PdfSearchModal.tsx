import React, { useState } from 'react';
import { X, Search, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import type { SearchMatch } from '../../types/book';

interface PdfSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  results: SearchMatch[];
  currentResultIndex: number;
  searching: boolean;
  searchProgress: number;
  onSearch: (query: string) => void;
  onClear: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectResult: (index: number) => void;
  onGoToPage: (page: number) => void;
}

export const PdfSearchModal: React.FC<PdfSearchModalProps> = ({
  isOpen,
  onClose,
  query,
  results,
  currentResultIndex,
  searching,
  searchProgress,
  onSearch,
  onClear,
  onNext,
  onPrev,
  onSelectResult,
  onGoToPage,
}) => {
  const [inputVal, setInputVal] = useState<string>(query);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onSearch(inputVal.trim());
    }
  };

  const handleResultClick = (index: number, page: number) => {
    onSelectResult(index);
    onGoToPage(page);
  };

  return (
    <div className="absolute top-16 right-4 sm:right-6 z-40 w-80 sm:w-96 glass-toolbar rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header & Search Form */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Search className="w-4 h-4 text-brand-400" />
            <span>Search in Publication</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Search (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              autoFocus
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Find keywords, topics..."
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  onClear();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching || !inputVal.trim()}
            className="px-3 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find'}
          </button>
        </form>

        {/* Progress & Result Counter */}
        {searching && (
          <div className="space-y-1">
            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-400 h-full transition-all duration-150"
                style={{ width: `${searchProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Indexing document pages {searchProgress}%...</p>
          </div>
        )}

        {!searching && query && (
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span>
              Found <strong className="text-brand-300">{results.length}</strong> matches
            </span>
            {results.length > 0 && (
              <div className="flex items-center gap-1">
                <span>{currentResultIndex + 1} of {results.length}</span>
                <button
                  type="button"
                  onClick={onPrev}
                  className="p-1 rounded bg-slate-900 border border-slate-800 hover:text-white"
                  title="Previous match"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="p-1 rounded bg-slate-900 border border-slate-800 hover:text-white"
                  title="Next match"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Snippet List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-850 scrollbar-thin">
        {results.map((res, i) => (
          <button
            key={i}
            onClick={() => handleResultClick(i, res.pageNumber)}
            className={`w-full text-left p-3 text-xs transition-colors flex items-start gap-2.5 ${
              i === currentResultIndex
                ? 'bg-brand-500/20 text-slate-100 border-l-2 border-brand-400'
                : 'text-slate-300 hover:bg-slate-900/60'
            }`}
          >
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-brand-400 font-bold shrink-0 mt-0.5">
              P.{res.pageNumber}
            </span>
            <p className="line-clamp-2 leading-relaxed text-[11px] text-slate-300 font-sans">
              {res.snippet}
            </p>
          </button>
        ))}

        {!searching && query && results.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400">
            No matches found for "{query}" in this publication.
          </div>
        )}
      </div>
    </div>
  );
};
