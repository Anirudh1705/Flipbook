export const config = {
  runtime: 'edge',
};

function normalizeUrl(rawUrl: string): string {
  let decoded = rawUrl;
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

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Origin, Content-Type, Accept',
        'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Range, Content-Length, Content-Type',
      },
    });
  }

  const { searchParams } = new URL(request.url);
  let rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new Response('Missing target url', { status: 400 });
  }

  // Handle nested/double proxy encoding
  while (rawUrl.includes('api/pdf-proxy?url=')) {
    const parts = rawUrl.split(/api\/pdf-proxy\?url=/);
    rawUrl = decodeURIComponent(parts[parts.length - 1]);
  }

  try {
    const targetUrl = normalizeUrl(rawUrl);

    const headers = new Headers({
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
    });

    const clientRange = request.headers.get('range');
    if (clientRange) {
      headers.set('Range', clientRange);
    }

    let response = await fetch(targetUrl, {
      headers,
      redirect: 'manual',
    });

    // Follow redirect manually if 301/302/307/308 (Archive.org storage redirection)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectTarget = new URL(location, targetUrl).toString();
        response = await fetch(normalizeUrl(redirectTarget), {
          headers,
          redirect: 'follow',
        });
      }
    }

    const responseHeaders = new Headers();
    response.headers.forEach((val, key) => {
      responseHeaders.set(key, val);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Origin, Content-Type, Accept');
    responseHeaders.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, Content-Type');
    responseHeaders.set('Accept-Ranges', 'bytes');
    if (!responseHeaders.has('Content-Type')) {
      responseHeaders.set('Content-Type', 'application/pdf');
    }

    return new Response(response.body, {
      status: response.status === 302 || response.status === 301 ? 200 : response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}
