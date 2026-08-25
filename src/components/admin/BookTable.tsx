import React, { useState } from 'react';
import type { Book } from '../../types/book';
import { Edit2, Trash2, CheckCircle2, Clock, Copy, Check, ExternalLink } from 'lucide-react';
import { formatBytes } from '../../lib/config';

interface BookTableProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, currentStatus: boolean) => void;
}

export const BookTable: React.FC<BookTableProps> = ({
  books,
  onEdit,
  onDelete,
  onTogglePublish,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (book: Book, format: 'slug' | 'number') => {
    const origin = window.location.origin;
    const path = format === 'number' 
      ? `/book/${String(book.book_number).padStart(2, '0')}` 
      : `/book/${book.slug}`;
    const url = `${origin}${path}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(`${book.id}-${format}`);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 w-14 text-center">ID</th>
              <th className="py-3.5 px-4">Publication Title & Public URL</th>
              <th className="py-3.5 px-4 hidden md:table-cell">Category & Author</th>
              <th className="py-3.5 px-4 hidden lg:table-cell">Size & Pages</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Unique Links & Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-850">
            {books.map(book => {
              const bookNumPadded = String(book.book_number).padStart(2, '0');
              const isCopiedNum = copiedId === `${book.id}-number`;

              return (
                <tr key={book.id || book.slug} className="hover:bg-slate-900/40 transition-colors">
                  {/* Book Number Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2 py-1 rounded-lg bg-brand-500/10 text-brand-400 font-mono font-bold text-xs border border-brand-500/20">
                      {bookNumPadded}
                    </span>
                  </td>

                  {/* Publication Details */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={book.cover_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=200&auto=format&fit=crop'}
                        alt=""
                        className="w-10 h-14 object-cover rounded-lg bg-slate-900 border border-slate-800 shrink-0 shadow-sm"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="font-bold text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                          {book.title}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                          <span className="text-slate-500">Links:</span>
                          <span className="text-brand-400">/book/{bookNumPadded}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400 truncate max-w-[120px]">/book/{book.slug}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Author */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="text-slate-200 font-medium">{book.category}</div>
                    <div className="text-slate-500 text-[11px]">{book.author || '—'}</div>
                  </td>

                  {/* Size & Pages */}
                  <td className="py-3.5 px-4 hidden lg:table-cell font-mono text-[11px] text-slate-400">
                    <div>{book.page_count || 14} pages</div>
                    <div className="text-slate-500">{formatBytes(book.file_size || 1048576)}</div>
                  </td>

                  {/* Published Status Toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onTogglePublish(book.id, book.is_published)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        book.is_published
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                      }`}
                    >
                      {book.is_published ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Draft</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions & Link Copying */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Copy Numeric Link */}
                      <button
                        onClick={() => handleCopyLink(book, 'number')}
                        className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-slate-800 flex items-center gap-1 text-[11px] transition-colors"
                        title={`Copy direct link: /book/${bookNumPadded}`}
                      >
                        {isCopiedNum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="font-mono">{isCopiedNum ? 'Copied!' : `/book/${bookNumPadded}`}</span>
                      </button>

                      {/* View Direct Link in Flipbook Reader */}
                      <a
                        href={`/book/${bookNumPadded}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Open Flipbook Reader in New Tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {/* Edit Metadata */}
                      <button
                        onClick={() => onEdit(book)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                        title="Edit Publication"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                            onDelete(book.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Delete Publication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
