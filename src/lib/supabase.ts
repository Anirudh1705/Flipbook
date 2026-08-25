import { createClient } from '@supabase/supabase-js';
import type { Book } from '../types/book';
import { STORAGE_KEYS } from './config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Empty initial books list (clean slate - only user-added publications)
export const INITIAL_BOOKS: Book[] = [];

// Helper to get local books from browser storage
export function getLocalBooks(): Book[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_DEMO_BOOKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the saved array has the old 25 sample books, clear it for a clean slate
      if (Array.isArray(parsed) && parsed.length === 25 && parsed[0]?.title?.includes('Global Horizons')) {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_DEMO_BOOKS);
        return [];
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse books from storage:', err);
  }
  return [];
}

export function saveLocalBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_DEMO_BOOKS, JSON.stringify(books));
  } catch (err) {
    console.warn('Failed to save books to storage:', err);
  }
}
