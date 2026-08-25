import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import http from 'node:http';
import https from 'node:https';

// Custom Vite plugin to proxy PDF streams seamlessly and eliminate all CORS issues in local development
function pdfCorsProxyPlugin() {
  return {
    name: 'vite-plugin-pdf-cors-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/pdf-proxy', (req: any, res: any) => {
        const urlParam = new URL(req.url, 'http://localhost').searchParams.get('url');
        if (!urlParam) {
          res.statusCode = 400;
          res.end('Missing url parameter');
          return;
        }

        try {
          const targetUrl = new URL(urlParam);
          const client = targetUrl.protocol === 'https:' ? https : http;

          const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
          };

          if (req.headers.range) {
            headers['Range'] = req.headers.range;
          }

          const proxyReq = client.get(
            targetUrl,
            {
              headers,
            },
            proxyRes => {
              // Handle redirects (e.g. archive.org 302 to storage nodes)
              if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                const redirectUrl = new URL(proxyRes.headers.location, targetUrl).toString();
                const redirectClient = redirectUrl.startsWith('https') ? https : http;
                redirectClient.get(redirectUrl, { headers }, finalRes => {
                  res.writeHead(finalRes.statusCode || 200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
                    'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length, Content-Type',
                    'Content-Type': finalRes.headers['content-type'] || 'application/pdf',
                    'Content-Length': finalRes.headers['content-length'] || '',
                    'Accept-Ranges': finalRes.headers['accept-ranges'] || 'bytes',
                    'Content-Range': finalRes.headers['content-range'] || '',
                  });
                  finalRes.pipe(res);
                }).on('error', err => {
                  res.statusCode = 500;
                  res.end(err.message);
                });
                return;
              }

              res.writeHead(proxyRes.statusCode || 200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
                'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length, Content-Type',
                'Content-Type': proxyRes.headers['content-type'] || 'application/pdf',
                'Content-Length': proxyRes.headers['content-length'] || '',
                'Accept-Ranges': proxyRes.headers['accept-ranges'] || 'bytes',
                'Content-Range': proxyRes.headers['content-range'] || '',
              });

              proxyRes.pipe(res);
            }
          );

          proxyReq.on('error', err => {
            res.statusCode = 500;
            res.end(err.message);
          });
        } catch (e: any) {
          res.statusCode = 500;
          res.end(e.message);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    pdfCorsProxyPlugin(),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router-dom') ||
            id.includes('node_modules/lucide-react')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
});
