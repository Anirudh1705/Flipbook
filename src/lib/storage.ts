import type { ReadingProgress } from '../types/book';
import { STORAGE_KEYS } from './config';

export function saveReadingProgress(slug: string, pageNumber: number, totalPages: number): void {
  try {
    const progress: ReadingProgress = {
      bookSlug: slug,
      pageNumber,
      timestamp: Date.now(),
      totalPages,
    };
    localStorage.setItem(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${slug}`, JSON.stringify(progress));
  } catch (err) {
    console.warn('Failed to save reading progress to localStorage:', err);
  }
}

export function getReadingProgress(slug: string): ReadingProgress | null {
  try {
    const data = localStorage.getItem(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${slug}`);
    if (!data) return null;
    return JSON.parse(data) as ReadingProgress;
  } catch (err) {
    console.warn('Failed to load reading progress from localStorage:', err);
    return null;
  }
}

export function clearReadingProgress(slug: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.READING_PROGRESS_PREFIX}${slug}`);
  } catch (err) {
    console.warn('Failed to clear reading progress:', err);
  }
}
