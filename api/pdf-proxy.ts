import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Readable } from 'node:stream';

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

  try {
    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const response = await fetch(rawUrl, {
      headers,
      redirect: 'follow',
    });

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/pdf');

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const contentRange = response.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    res.status(response.status);

    if (!response.body) {
      return res.end();
    }

    // Stream the fetch body directly to Vercel Response
    // @ts-ignore
    const nodeStream = Readable.fromWeb(response.body);
    nodeStream.pipe(res);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).send(`Proxy fetch error: ${err.message}`);
    }
  }
}
