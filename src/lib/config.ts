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
  ADMIN_USER_EMAIL: 'flipbook_admin_user_email',
};

// Whitelist of authorized administrator email addresses
export const ADMIN_EMAILS: string[] = [
  'anirudhkaushik@galgotiasuniversity.edu.in',
  'anirudhsharma9893@gmail.com',
];

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase().trim());
}

// Format bytes into human readable format (MB, GB, KB)
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
