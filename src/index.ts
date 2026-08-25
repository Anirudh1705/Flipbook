// Core Components
export { FlipbookViewer } from './components/pdf/FlipbookViewer';
export { PdfScrollPage } from './components/pdf/PdfScrollPage';
export { PdfPageCanvas } from './components/pdf/PdfPageCanvas';
export { PdfToolbar } from './components/pdf/PdfToolbar';
export { PdfThumbnails } from './components/pdf/PdfThumbnails';
export { PdfSearchModal } from './components/pdf/PdfSearchModal';
export { ResumePrompt } from './components/pdf/ResumePrompt';

// Hooks
export { usePdfDocument } from './hooks/usePdfDocument';
export { usePdfSearch } from './hooks/usePdfSearch';
export { useReadingProgress } from './hooks/useReadingProgress';
export { useBooks } from './hooks/useBooks';
export { useBookBySlug } from './hooks/useBookBySlug';

// Utilities & Resolvers
export { resolveDirectPdfUrl } from './lib/pdfUrlResolver';
export { getOptimizedDocumentTask } from './lib/pdfjs';
export { getLocalBooks, isSupabaseConfigured } from './lib/supabase';
export { formatBytes } from './lib/config';

// Types
export type { Book, SearchMatch, ReadingProgress, ViewerSettings } from './types/book';
