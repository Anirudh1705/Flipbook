import http from 'node:http';
import https from 'node:https';

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

function streamUrl(
  targetUrl: string,
  clientRange: string | undefined,
  req: any,
  res: any,
  redirectCount = 0
) {
  if (redirectCount > 5) {
    res.status(500).send('Too many redirects');
    return;
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

    if (clientRange) {
      headers['Range'] = clientRange;
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
        // Handle Redirects (301, 302, 307, 308)
        if (
          proxyRes.statusCode &&
          proxyRes.statusCode >= 300 &&
          proxyRes.statusCode < 400 &&
          proxyRes.headers.location
        ) {
          const redirectLocation = new URL(proxyRes.headers.location, targetUrl).toString();
          streamUrl(redirectLocation, clientRange, req, res, redirectCount + 1);
          return;
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
        res.setHeader(
          'Access-Control-Expose-Headers',
          'Accept-Ranges, Content-Range, Content-Length, Content-Type'
        );
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

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Accept-Ranges, Content-Range, Content-Length, Content-Type'
    );
    res.status(204).end();
    return;
  }

  let rawUrl = (req.query.url as string) || '';

  if (!rawUrl) {
    res.status(400).send('Missing url parameter');
    return;
  }

  // Handle nested/double proxy encoding
  while (rawUrl.includes('api/pdf-proxy?url='')) {
    const parts = rawUrl.split(/api\/pdf-proxy\?url=/);
    rawUrl = decodeURIComponent(parts[parts.length - 1]);
  }

  let targetUrl = rawUrl;

  // If target is an Archive.org download gateway, resolve to direct storage cluster node
  const archiveDownloadMatch = targetUrl.match(/archive\.org\/download\/([^/]+)\/(.+)/i);
  if (archiveDownloadMatch) {
    const identifier = archiveDownloadMatch[1];
    const filename = archiveDownloadMatch[2];
    const meta = await fetchArchiveMetadata(identifier);
    if (meta) {
      const server = meta.server || meta.d1 || meta.workable_servers?.[0] || 'ia601801.us.archive.org';
      const dir = meta.dir || `/items/${identifier}`;
      targetUrl = `https://${server}${dir}/${filename}`;
    }
  }

  streamUrl(targetUrl, req.headers.range, req, res);
}
