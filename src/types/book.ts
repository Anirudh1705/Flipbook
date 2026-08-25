export interface Book {
  id: string;
  book_number: number;
  title: string;
  slug: string;
  description: string;
  cover_url: string;
  pdf_url: string;
  category: string;
  author: string;
  publication_date: string;
  page_count: number;
  file_size: number; // in bytes
  is_published: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ViewerSettings {
  allowDownload: boolean;
  allowPrint: boolean;
  allowTextSelection: boolean;
  defaultSpreadMode: 'auto' | 'single' | 'double';
  enableKeyboardNavigation: boolean;
}

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  snippet: string;
}

export interface ReadingProgress {
  bookSlug: string;
  pageNumber: number;
  timestamp: number;
  totalPages: number;
}
