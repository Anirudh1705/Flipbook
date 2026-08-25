import React, { useState } from 'react';
import { AdminLayout } from '../components/admin/AdminLayout';
import { BookTable } from '../components/admin/BookTable';
import { BookFormModal } from '../components/admin/BookFormModal';
import { R2GuideModal } from '../components/admin/R2GuideModal';
import { SEO } from '../components/common/SEO';
import { useBooks } from '../hooks/useBooks';
import type { Book } from '../types/book';
import { BookOpen, CheckCircle2, Clock, Cloud, Search } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { books, loading, saveBook, deleteBook, togglePublish } = useBooks();

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isR2GuideOpen, setIsR2GuideOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingBook(null);
    setIsFormOpen(true);
  };

  const handleSave = async (bookData: Partial<Book>) => {
    await saveBook(bookData);
  };

  // Metrics
  const totalCount = books.length;
  const publishedCount = books.filter(b => b.is_published).length;
  const draftCount = totalCount - publishedCount;

  const filteredBooks = books.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.category && b.category.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      String(b.book_number).includes(q)
    );
  });

  return (
    <AdminLayout onOpenR2Guide={() => setIsR2GuideOpen(true)} onOpenAddModal={handleAddNew}>
      <SEO title="Admin Dashboard | Flipbook Pro" />

      <div className="space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400">Total Publications</span>
              <div className="text-2xl font-bold text-slate-100">{totalCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-emerald-400">Live & Published</span>
              <div className="text-2xl font-bold text-slate-100">{publishedCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-mono text-amber-400">Drafts / Inactive</span>
              <div className="text-2xl font-bold text-slate-100">{draftCount}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter publications by title, slug, or author..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsR2GuideOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-sky-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>R2 Storage Instructions</span>
            </button>
          </div>
        </div>

        {/* Publications Table */}
        {loading ? (
          <div className="glass-panel p-12 rounded-2xl text-center text-xs text-slate-400 font-mono animate-pulse">
            Loading publication database...
          </div>
        ) : (
          <BookTable
            books={filteredBooks}
            onEdit={handleEdit}
            onDelete={deleteBook}
            onTogglePublish={togglePublish}
          />
        )}
      </div>

      {/* Modals */}
      <BookFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialBook={editingBook}
      />

      <R2GuideModal
        isOpen={isR2GuideOpen}
        onClose={() => setIsR2GuideOpen(false)}
      />
    </AdminLayout>
  );
};
