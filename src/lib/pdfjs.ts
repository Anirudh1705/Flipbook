import * as pdfjsLib from 'pdfjs-dist';
import { getPdfFromStorage } from './pdfStorage';
import { getCachedPdfBinary, setCachedPdfBinary } from './pdfCache';

// Configure the PDF.js Web Worker using the modern mjs worker URL in Vite
const PDFJS_VERSION = pdfjsLib.version || '4.10.38';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
}

/**
 * Creates an optimized PDF.js loading task with instant memory cache, browser CacheStorage, or HTTP Range Requests.
 */
export async function getOptimizedDocumentTask(url: string) {
  // 1. If stored in local browser IndexedDB (from local upload)
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

  // 2. Check instant L1/L2 in-memory and CacheStorage cache
  const cachedBinary = await getCachedPdfBinary(url);
  if (cachedBinary) {
    return pdfjsLib.getDocument({
      data: cachedBinary,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
    });
  }

  // 3. Fallback to progressive HTTP byte range streaming with background caching
  const task = pdfjsLib.getDocument({
    url,
    disableAutoFetch: true,
    disableStream: false,
    disableRange: false,
    rangeChunkSize: 65536, // 64 KB chunks
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`,
  });

  // Background caching: Once document promise resolves, save full binary into cache for instant repeat loads
  task.promise.then(async (doc) => {
    try {
      const data = await doc.getData();
      if (data && data.length > 0) {
        setCachedPdfBinary(url, data);
      }
    } catch (e) {
      // Ignore background cache errors
    }
  });

  return task;
}

export { pdfjsLib };
