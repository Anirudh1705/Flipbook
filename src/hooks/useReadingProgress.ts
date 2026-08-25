import { useState, useEffect, useCallback } from 'react';
import { getReadingProgress, saveReadingProgress, clearReadingProgress } from '../lib/storage';
import type { ReadingProgress } from '../types/book';

export function useReadingProgress(slug?: string) {
  const [savedProgress, setSavedProgress] = useState<ReadingProgress | null>(null);
  const [hasPrompted, setHasPrompted] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;
    const existing = getReadingProgress(slug);
    if (existing && existing.pageNumber > 1) {
      setSavedProgress(existing);
    }
  }, [slug]);

  const updateProgress = useCallback((pageNumber: number, totalPages: number) => {
    if (!slug || pageNumber <= 0 || totalPages <= 0) return;
    saveReadingProgress(slug, pageNumber, totalPages);
  }, [slug]);

  const dismissPrompt = useCallback(() => {
    setHasPrompted(true);
    setSavedProgress(null);
  }, []);

  const resetProgress = useCallback(() => {
    if (!slug) return;
    clearReadingProgress(slug);
    setSavedProgress(null);
    setHasPrompted(true);
  }, [slug]);

  return {
    savedProgress: hasPrompted ? null : savedProgress,
    updateProgress,
    dismissPrompt,
    resetProgress,
  };
}
