import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowUpRight, Calendar, BookmarkCheck } from 'lucide-react';
import type { Book } from '../../types/book';
import { formatBytes } from '../../lib/config';
import { getReadingProgress } from '../../lib/storage';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const progress = getReadingProgress(book.slug);
  const formattedNumber = String(book.book_number).padStart(2, '0');

  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900/70 border border-slate-800/90 overflow-hidden hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 transform hover:-translate-y-1">
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-950">
        <img
          src={book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop'}
          alt={book.title}
          loading="lazy"
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e: any) => {
            e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop';
          }}
        />

        {/* Soft gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-950/80 text-brand-400 border border-brand-500/30 backdrop-blur-md shadow-sm">
            #{formattedNumber}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md truncate max-w-[140px]">
            {book.category}
          </span>
        </div>

        {/* Previous Reading Progress Tag */}
        {progress && progress.pageNumber > 1 && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[11px] backdrop-blur-md">
            <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resume page {progress.pageNumber}</span>
          </div>
        )}
      </div>

      {/* Book Content Metadata */}
      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
            {book.publication_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(book.publication_date).getFullYear()}
              </span>
            )}
            <span>•</span>
            <span>{book.page_count || 14} pages</span>
            <span>•</span>
            <span>{formatBytes(book.file_size || 1048576)}</span>
          </div>

          <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-brand-300 transition-colors line-clamp-2">
            {book.title}
          </h3>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
          {book.description || 'Explore this comprehensive publication featuring in-depth analysis, charts, and illustrations.'}
        </p>

        {book.author && (
          <p className="text-[11px] text-slate-500 italic truncate">
            By {book.author}
          </p>
        )}

        {/* Read Now CTA */}
        <div className="pt-2 border-t border-slate-800/80">
          <Link
            to={`/book/${book.slug}`}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-brand-500 text-slate-200 hover:text-slate-950 font-semibold text-xs transition-all duration-200 group-hover:bg-brand-500 group-hover:text-slate-950 shadow-sm"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>READ PUBLICATION</span>
            </span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
