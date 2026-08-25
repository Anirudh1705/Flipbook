import React from 'react';
import type { Book } from '../../types/book';
import { BookCard } from './BookCard';
import { BookOpen, RefreshCw } from 'lucide-react';

interface BookGridProps {
  books: Book[];
  loading: boolean;
  onClearFilters?: () => void;
}

export const BookGrid: React.FC<BookGridProps> = ({ books, loading, onClearFilters }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-slate-900/40 border border-slate-800 p-4 space-y-4 animate-pulse"
          >
            <div className="aspect-[3/4] w-full bg-slate-800/60 rounded-xl" />
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800/60 rounded w-full" />
            <div className="h-8 bg-slate-800/80 rounded-xl w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-20 px-4 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-200">No Publications Found</h3>
        <p className="text-sm text-slate-400">
          We couldn't find any publications matching your current search or category filter.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Search & Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {books.map(book => (
        <BookCard key={book.id || book.slug} book={book} />
      ))}
    </div>
  );
};
