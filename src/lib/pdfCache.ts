/**
 * High-performance browser cache & in-memory temporary cache for PDF binaries.
 * Automatically caches remote PDFs so repeat views and scroll backs load instantly with 0ms delay.
 */

const MEMORY_CACHE = new Map<string, Uint8Array>();
const CACHE_NAME = 'flipbook-pdf-binary-cache-v1';

/**
 * Retrieves cached PDF binary from in-memory RAM or browser CacheStorage.
 */
export async function getCachedPdfBinary(url: string): Promise<Uint8Array | null> {
  // 1. Instant L1 in-memory RAM cache
  if (MEMORY_CACHE.has(url)) {
    return MEMORY_CACHE.get(url)!;
  }

  // 2. L2 Browser CacheStorage API
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        const buffer = await response.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        MEMORY_CACHE.set(url, uint8);
        return uint8;
      }
    } catch (e) {
      console.warn('CacheStorage read error:', e);
    }
  }

  return null;
}

/**
 * Stores PDF binary into in-memory RAM and browser CacheStorage in the background.
 */
export async function setCachedPdfBinary(url: string, data: Uint8Array): Promise<void> {
  MEMORY_CACHE.set(url, data);

  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(data.buffer as ArrayBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(data.byteLength),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
      await cache.put(url, response);
    } catch (e) {
      console.warn('CacheStorage write error:', e);
    }
  }
}
