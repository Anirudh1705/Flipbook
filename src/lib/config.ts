import type { ViewerSettings } from '../types/book';

export const DEFAULT_VIEWER_SETTINGS: ViewerSettings = {
  allowDownload: false,
  allowPrint: false,
  allowTextSelection: true,
  defaultSpreadMode: 'auto',
  enableKeyboardNavigation: true,
};

export const STORAGE_KEYS = {
  READING_PROGRESS_PREFIX: 'flipbook_reading_progress_',
  VIEWER_SETTINGS: 'flipbook_viewer_settings',
  ADMIN_DEMO_BOOKS: 'flipbook_admin_demo_books',
};

// Format bytes into human readable format (MB, GB, KB)
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
