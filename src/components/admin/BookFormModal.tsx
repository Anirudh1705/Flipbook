import React, { useState, useEffect, useRef } from 'react';
import { X, Save, FileUp, Link2, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import type { Book } from '../../types/book';
import { resolveDirectPdfUrl } from '../../lib/pdfUrlResolver';
import { savePdfToStorage } from '../../lib/pdfStorage';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (book: Partial<Book>) => Promise<void>;
  initialBook?: Book | null;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBook,
}) => {
  const [title, setTitle] = useState<string>('');
  const [pdfSourceType, setPdfSourceType] = useState<'upload' | 'url'>('upload');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number>(50 * 1024 * 1024);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialBook) {
      setTitle(initialBook.title);
      setPdfUrl(initialBook.pdf_url);
      setPdfSourceType(initialBook.pdf_url.startsWith('idb://') ? 'upload' : 'url');
      setSelectedFile(null);
      setSelectedFileName(null);
      setSelectedFileSize(initialBook.file_size || 0);
    } else {
      setTitle('');
      setPdfUrl('');
      setPdfSourceType('upload');
      setSelectedFile(null);
      setSelectedFileName(null);
      setSelectedFileSize(0);
    }
    setError(null);
  }, [initialBook, isOpen]);

  // Handle local PDF file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document (.pdf).');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);

    // If title is currently empty, auto-populate from file name
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Please enter a publication title.');
      return;
    }

    if (pdfSourceType === 'upload' && !selectedFile && !initialBook?.pdf_url) {
      setError('Please select a PDF file from your computer.');
      return;
    }

    if (pdfSourceType === 'url' && !pdfUrl.trim()) {
      setError('Please provide a direct PDF URL.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Auto-generate clean slug from title
      const cleanSlug =
        initialBook?.slug ||
        title
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

      let finalPdfUrl = '';
      let detectedPages = initialBook?.page_count || 0;

      if (pdfSourceType === 'upload' && selectedFile) {
        const fileKey = `pdf_${Date.now()}_${cleanSlug}`;
        finalPdfUrl = await savePdfToStorage(fileKey, selectedFile);
      } else if (pdfSourceType === 'upload' && initialBook?.pdf_url) {
        finalPdfUrl = initialBook.pdf_url;
      } else {
        finalPdfUrl = await resolveDirectPdfUrl(pdfUrl.trim());
      }

      // Default high-resolution cover artwork
      const defaultCover =
        initialBook?.cover_url ||
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop';

      await onSave({
        id: initialBook?.id,
        title: title.trim(),
        slug: cleanSlug,
        pdf_url: finalPdfUrl,
        cover_url: defaultCover,
        description: initialBook?.description || `${title.trim()} publication.`,
        category: initialBook?.category || 'General Publications',
        author: initialBook?.author || 'Editorial Team',
        publication_date: initialBook?.publication_date || new Date().toISOString().split('T')[0],
        page_count: detectedPages || (initialBook?.page_count ?? 8),
        file_size: selectedFileSize || (initialBook?.file_size ?? 0),
        is_published: true,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save publication');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-toolbar p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {initialBook ? 'Edit Publication' : 'Add New PDF'}
              </h2>
              <p className="text-[11px] text-slate-400">Enter title and select your PDF</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Simple Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Publication Title */}
          <div className="space-y-1.5">
            <label className="text-slate-200 font-semibold text-xs">
              Publication Title <span className="text-brand-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Annual Innovation Report 2026"
              className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          {/* 2. PDF Source Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold text-xs">
                PDF Document <span className="text-brand-400">*</span>
              </label>

              {/* Source Toggle */}
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPdfSourceType('upload')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
                    pdfSourceType === 'upload'
                      ? 'bg-brand-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileUp className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfSourceType('url')}
                  className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
                    pdfSourceType === 'url'
                      ? 'bg-brand-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  <span>PDF Link</span>
                </button>
              </div>
            </div>

            {pdfSourceType === 'upload' ? (
              /* Upload Drag & Drop Area */
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-brand-500/60 bg-slate-900/60 hover:bg-slate-900 cursor-pointer flex flex-col items-center justify-center text-center gap-2 transition-all group"
                >
                  {selectedFileName ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="truncate max-w-[240px]">{selectedFileName}</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-brand-500/20 flex items-center justify-center text-slate-400 group-hover:text-brand-400 transition-colors">
                        <FileUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-200 group-hover:text-white">
                          Click to choose PDF file from computer
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Instant local storage • Zero setup</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* URL Input */
              <div className="space-y-1">
                <input
                  type="url"
                  required
                  value={pdfUrl}
                  onChange={e => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf or archive.org link"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-mono text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-500 font-mono">
                  Paste any direct PDF link or Archive.org link
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Add Publication'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
