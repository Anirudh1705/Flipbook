import * as pdfjsLib from 'pdfjs-dist';

// Configure the PDF.js Web Worker using the modern mjs worker URL in Vite
const PDFJS_VERSION = pdfjsLib.version || '4.10.38';

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.mjs`;
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  }
}

/**
 * Creates an optimized PDF.js loading task with HTTP Range Requests enabled.
 * 
 * IMPORTANT:
 * - disableAutoFetch: true -> Prevents PDF.js from downloading the whole file upfront.
 * - disableStream: false -> Enables progressive streaming of byte ranges.
 * - rangeChunkSize: 65536 -> Requests 64KB chunks as needed (ideal for 300-500MB PDFs).
 */
export function getOptimizedDocumentTask(url: string) {
  return pdfjsLib.getDocument({
    url,
    // Critical large-PDF streaming optimizations
    disableAutoFetch: true,
    disableStream: false,
    disableRange: false,
    rangeChunkSize: 65536, // 64 KB chunks
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
  });
}

export { pdfjsLib };
