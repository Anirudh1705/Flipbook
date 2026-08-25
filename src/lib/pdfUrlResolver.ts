/**
 * Intelligent PDF URL Resolver
 * Automatically resolves webpage / repository / cloud links into direct streaming PDF URLs
 * and routes non-CORS hosts (like Archive.org) through the built-in streaming proxy.
 */
export async function resolveDirectPdfUrl(rawUrl: string): Promise<string> {
  const url = rawUrl.trim();

  // 1. Internet Archive details page: https://archive.org/details/IDENTIFIER
  const archiveDetailsMatch = url.match(/^https?:\/\/archive\.org\/details\/([^/?#]+)/i);
  if (archiveDetailsMatch) {
    const identifier = archiveDetailsMatch[1];
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const pdfFile = meta?.files?.find((f: any) =>
          f?.name?.toLowerCase()?.endsWith('.pdf') || f?.format?.toLowerCase()?.includes('pdf')
        );
        if (pdfFile && pdfFile.name) {
          const encodedName = encodeURIComponent(pdfFile.name).replace(/%2F/g, '/');
          const directArchiveUrl = `https://archive.org/download/${identifier}/${encodedName}`;
          // In development or when proxy is available, route through proxy to bypass Archive.org CORS
          return `/api/pdf-proxy?url=${encodeURIComponent(directArchiveUrl)}`;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Direct Archive.org download link: https://archive.org/download/...
  if (url.includes('archive.org/download/')) {
    return `/api/pdf-proxy?url=${encodeURIComponent(url)}`;
  }

  // 3. GitHub Blob URL: https://github.com/user/repo/blob/main/doc.pdf -> raw.githubusercontent.com
  const githubBlobMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+\.pdf)$/i);
  if (githubBlobMatch) {
    const [, user, repo, branch, path] = githubBlobMatch;
    return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
  }

  // 4. Dropbox share links: https://www.dropbox.com/s/xxxx/doc.pdf?dl=0 -> ?raw=1
  if (url.includes('dropbox.com/s/')) {
    return url.replace(/[?&]dl=[01]/, '').concat(url.includes('?') ? '&raw=1' : '?raw=1');
  }

  // 5. Google Drive share links: https://drive.google.com/file/d/FILE_ID/view -> uc?export=download&id=FILE_ID
  const gdriveMatch = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch) {
    const fileId = gdriveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  return url;
}
