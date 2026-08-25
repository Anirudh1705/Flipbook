/**
 * Intelligent PDF URL Resolver
 * Automatically resolves webpage / repository / cloud links into direct streaming PDF URLs
 * and routes non-CORS hosts (like Archive.org) through the built-in streaming proxy.
 */
export async function resolveDirectPdfUrl(rawUrl: string): Promise<string> {
  let url = rawUrl.trim();

  // Strip existing proxy wrappers to avoid double-proxying
  while (url.includes('api/pdf-proxy?url=')) {
    const parts = url.split(/api\/pdf-proxy\?url=/);
    url = decodeURIComponent(parts[parts.length - 1]);
  }

  // 1. Internet Archive details page: https://archive.org/details/IDENTIFIER
  const archiveDetailsMatch = url.match(/^https?:\/\/archive\.org\/details\/([^/?#]+)/i);
  if (archiveDetailsMatch) {
    const identifier = archiveDetailsMatch[1];
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const pdfFile = meta?.files?.find(
          (f: any) =>
            f?.name?.toLowerCase()?.endsWith('.pdf') || f?.format?.toLowerCase()?.includes('pdf')
        );
        if (pdfFile && pdfFile.name) {
          const server = meta.server || meta.d1 || meta.workable_servers?.[0] || 'ia601801.us.archive.org';
          const dir = meta.dir || `/items/${identifier}`;
          const directStorageUrl = `https://${server}${dir}/${encodeURI(decodeURI(pdfFile.name))}`;
          return `/api/pdf-proxy?url=${encodeURIComponent(directStorageUrl)}`;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Direct Archive.org download link: https://archive.org/download/... or storage node link
  if (url.includes('archive.org/download/') || url.includes('.archive.org/items/')) {
    const cleanUrl = encodeURI(decodeURI(url));
    return `/api/pdf-proxy?url=${encodeURIComponent(cleanUrl)}`;
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
