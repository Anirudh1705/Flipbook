import * as pdfjsLib from 'pdfjs-dist';
import { getPdfFromStorage } from './pdfStorage';

// Configure the PDF.js Web Worker using the modern mjs worker URL in Vite
const PDFJS_VERSION = pdfjsLib.version || '4.10.38';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
}

/**
 * Creates an optimized PDF.js loading task with HTTP Range Requests or ArrayBuffer from IndexedDB.
 */
export async function getOptimizedDocumentTask(url: string) {
  // If stored in local browser IndexedDB (from local upload)
  if (url.startsWith('idb://')) {
    const blob = await getPdfFromStorage(url);
    if (!blob) {
      throw new Error('Local PDF document was not found in browser storage. Please re-upload the file.');
    }
    const arrayBuffer = await blob.arrayBuffer();
    return pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
    });
  }

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
