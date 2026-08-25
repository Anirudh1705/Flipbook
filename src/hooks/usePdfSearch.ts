import { useState, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { SearchMatch } from '../types/book';

export function usePdfSearch(pdfDocument: PDFDocumentProxy | null) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchProgress, setSearchProgress] = useState<number>(0);

  const abortRef = useRef<boolean>(false);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!pdfDocument || !searchTerm.trim()) {
      setResults([]);
      setCurrentResultIndex(-1);
      setSearching(false);
      return;
    }

    setSearching(true);
    setQuery(searchTerm);
    setSearchProgress(0);
    abortRef.current = false;

    const matches: SearchMatch[] = [];
    const normalizedTerm = searchTerm.toLowerCase();
    const numPages = pdfDocument.numPages;

    try {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (abortRef.current) break;

        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const fullPageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        const lowerText = fullPageText.toLowerCase();
        let startIndex = 0;
        let matchIdx = 0;

        while ((startIndex = lowerText.indexOf(normalizedTerm, startIndex)) !== -1) {
          // Extract a 60-character context snippet
          const snippetStart = Math.max(0, startIndex - 25);
          const snippetEnd = Math.min(fullPageText.length, startIndex + normalizedTerm.length + 35);
          const rawSnippet = fullPageText.substring(snippetStart, snippetEnd);
          const snippet = (snippetStart > 0 ? '...' : '') + rawSnippet.trim() + (snippetEnd < fullPageText.length ? '...' : '');

          matches.push({
            pageNumber: pageNum,
            matchIndex: matchIdx++,
            snippet,
          });

          startIndex += normalizedTerm.length;
        }

        setSearchProgress(Math.round((pageNum / numPages) * 100));
        // Yield tick to avoid blocking main thread UI
        if (pageNum % 5 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }
      }

      setResults(matches);
      setCurrentResultIndex(matches.length > 0 ? 0 : -1);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearching(false);
    }
  }, [pdfDocument]);

  const clearSearch = useCallback(() => {
    abortRef.current = true;
    setQuery('');
    setResults([]);
    setCurrentResultIndex(-1);
    setSearching(false);
  }, []);

  const nextResult = useCallback(() => {
    if (results.length === 0) return;
    setCurrentResultIndex(prev => (prev + 1) % results.length);
  }, [results.length]);

  const prevResult = useCallback(() => {
    if (results.length === 0) return;
    setCurrentResultIndex(prev => (prev - 1 + results.length) % results.length);
  }, [results.length]);

  const selectResult = useCallback((index: number) => {
    if (index >= 0 && index < results.length) {
      setCurrentResultIndex(index);
    }
  }, [results.length]);

  return {
    query,
    results,
    currentResultIndex,
    currentMatch: results[currentResultIndex] || null,
    searching,
    searchProgress,
    performSearch,
    clearSearch,
    nextResult,
    prevResult,
    selectResult,
  };
}
