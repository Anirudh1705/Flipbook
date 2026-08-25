import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'node:https';
import http from 'node:http';

function fetchArchiveMetadata(identifier: string): Promise<any> {
  return new Promise(resolve => {
    https
      .get(`https://archive.org/metadata/${identifier}`, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      })
      .on('error', () => resolve(null));
  });
}

function encodePath(pathname: string): string {
  let decoded = pathname;
  try {
    while (
      decoded.includes('%20') ||
      decoded.includes('%25') ||
      decoded.includes('%28') ||
      decoded.includes('%29')
    ) {
      const prev = decoded;
      decoded = decodeURIComponent(decoded);
      if (decoded === prev) break;
    }
  } catch {}

  return encodeURI(decoded)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Accept-Ranges, Content-Range, Content-Length, Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  let rawUrl = (req.query.url as string) || '';
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  while (rawUrl.includes('api/pdf-proxy?url=')) {
    const parts = rawUrl.split(/api\/pdf-proxy\?url=/);
    rawUrl = decodeURIComponent(parts[parts.length - 1]);
  }

  let targetUrl = rawUrl;
  const archiveDownloadMatch = targetUrl.match(/archive\.org\/download\/([^/]+)\/(.+)/i);
  if (archiveDownloadMatch) {
    const identifier = archiveDownloadMatch[1];
    const filename = archiveDownloadMatch[2];
    const meta = await fetchArchiveMetadata(identifier);
    if (meta) {
      const server =
        meta.server || meta.d1 || meta.workable_servers?.[0] || 'ia601801.us.archive.org';
      const dir = meta.dir || `/items/${identifier}`;
      targetUrl = `https://${server}${dir}/${filename}`;
    }
  }

  try {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const safePath = encodePath(parsed.pathname) + (parsed.search || '');

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
      Host: parsed.host,
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const proxyReq = client.get(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: safePath,
        headers,
      },
      proxyRes => {
        if (
          proxyRes.statusCode &&
          proxyRes.statusCode >= 300 &&
          proxyRes.statusCode < 400 &&
          proxyRes.headers.location
        ) {
          const redirectLocation = new URL(proxyRes.headers.location, targetUrl).toString();
          const redParsed = new URL(redirectLocation);
          const redClient = redParsed.protocol === 'https:' ? https : http;
          const redPath = encodePath(redParsed.pathname) + (redParsed.search || '');
          const redReq = redClient.get(
            {
              protocol: redParsed.protocol,
              hostname: redParsed.hostname,
              port: redParsed.port || (redParsed.protocol === 'https:' ? 443 : 80),
              path: redPath,
              headers: { ...headers, Host: redParsed.host },
            },
            redRes => {
              res.setHeader('Accept-Ranges', 'bytes');
              res.setHeader('Content-Type', redRes.headers['content-type'] || 'application/pdf');
              if (redRes.headers['content-length']) {
                res.setHeader('Content-Length', redRes.headers['content-length']);
              }
              if (redRes.headers['content-range']) {
                res.setHeader('Content-Range', redRes.headers['content-range']);
              }
              res.status(redRes.statusCode || 200);
              redRes.pipe(res);
            }
          );
          redReq.on('error', err => {
            if (!res.headersSent) res.status(500).send(err.message);
          });
          return;
        }

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/pdf');
        if (proxyRes.headers['content-length']) {
          res.setHeader('Content-Length', proxyRes.headers['content-length']);
        }
        if (proxyRes.headers['content-range']) {
          res.setHeader('Content-Range', proxyRes.headers['content-range']);
        }

        res.status(proxyRes.statusCode || 200);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', err => {
      if (!res.headersSent) {
        res.status(500).send(`Proxy error: ${err.message}`);
      }
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).send(`Proxy error: ${err.message}`);
    }
  }
}
