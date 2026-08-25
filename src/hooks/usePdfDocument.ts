import { useState, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getOptimizedDocumentTask } from '../lib/pdfjs';
import { resolveDirectPdfUrl } from '../lib/pdfUrlResolver';

interface UsePdfDocumentResult {
  pdfDocument: PDFDocumentProxy | null;
  totalPages: number;
  loading: boolean;
  progress: number;
  progressStage: string;
  error: string | null;
  retry: () => void;
}

export function usePdfDocument(url?: string): UsePdfDocumentResult {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('Initializing PDF connection...');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const loadingTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setProgress(10);
    setProgressStage('Resolving document stream...');

    async function initializeDoc() {
      if (!url) return;
      try {
        // Automatically resolve webpage URLs (e.g. archive.org/details/..., dropbox, github) to direct streaming PDF URLs
        const directUrl = await resolveDirectPdfUrl(url);

        if (!isMounted) return;

        const loadingTask = getOptimizedDocumentTask(directUrl);
        loadingTaskRef.current = loadingTask;

        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (isMounted) {
            if (total > 0) {
              const pct = Math.min(Math.round((loaded / total) * 100), 95);
              setProgress(pct);
              setProgressStage(`Fetching header ranges (${(loaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB)...`);
            } else {
              setProgress(-1);
              setProgressStage(`Streaming byte ranges (${(loaded / 1024 / 1024).toFixed(1)} MB stream)...`);
            }
          }
        };

        const doc: PDFDocumentProxy = await loadingTask.promise;

        if (!isMounted) {
          (doc as any).destroy?.();
          return;
        }

        setPdfDocument(doc);
        setTotalPages(doc.numPages);
        setProgress(100);
        setProgressStage(`Ready (${doc.numPages} pages indexed)`);
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('PDF.js loading error:', err);
        let userMsg = 'Unable to stream or open this PDF publication.';
        if (err.name === 'MissingPDFException') {
          userMsg = 'PDF document could not be found at the specified URL.';
        } else if (err.name === 'InvalidPDFException') {
          userMsg = 'The PDF file is corrupted or not a valid PDF format.';
        } else if (err.message && err.message.includes('CORS')) {
          userMsg = 'CORS Error: The PDF storage server does not allow cross-origin requests.';
        }
        setError(userMsg);
        setLoading(false);
      }
    }

    initializeDoc();

    return () => {
      isMounted = false;
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy?.();
        } catch {}
      }
      if (pdfDocument) {
        try {
          (pdfDocument as any).destroy?.();
        } catch {}
      }
    };
  }, [url, retryCount]);

  const retry = () => {
    setRetryCount(c => c + 1);
  };

  return {
    pdfDocument,
    totalPages,
    loading,
    progress,
    progressStage,
    error,
    retry,
  };
}
