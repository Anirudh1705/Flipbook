/**
 * Intelligent PDF URL Resolver
 * Automatically resolves webpage / repository / cloud links into direct streaming PDF URLs.
 */
export function cleanArchiveFilename(name: string): string {
  let decoded = name;
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

export async function resolveDirectPdfUrl(rawUrl: string): Promise<string> {
  let url = rawUrl.trim();

  // Strip existing proxy wrappers to avoid duplicate proxying
  while (url.includes('api/pdf-proxy?url=')) {
    const parts = url.split(/api\/pdf-proxy\?url=/);
    url = decodeURIComponent(parts[parts.length - 1]);
  }

  // 1. Internet Archive details page or download link
  const archiveMatch =
    url.match(/^https?:\/\/archive\.org\/(?:details|download)\/([^/?#]+)(?:\/(.*))?/i) ||
    url.match(/^https?:\/\/[a-z0-9.]+\.archive\.org\/(?:[0-9]+\/)?items\/([^/?#]+)(?:\/(.*))?/i);

  if (archiveMatch) {
    const identifier = archiveMatch[1];
    const targetFile = archiveMatch[2];
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const server =
          meta.server || meta.d1 || meta.workable_servers?.[0] || 'ia601801.us.archive.org';
        const dir = meta.dir || `/items/${identifier}`;

        let filename = '';
        if (targetFile) {
          filename = decodeURIComponent(targetFile);
        } else {
          const pdfFile = meta?.files?.find(
            (f: any) =>
              f?.name?.toLowerCase()?.endsWith('.pdf') || f?.format?.toLowerCase()?.includes('pdf')
          );
          if (pdfFile && pdfFile.name) {
            filename = pdfFile.name;
          }
        }

        if (filename) {
          const encodedFilename = cleanArchiveFilename(filename);
          const directClusterUrl = `https://${server}${dir}/${encodedFilename}`;
          return `/api/pdf-proxy?url=${encodeURIComponent(directClusterUrl)}`;
        }
      }
    } catch {
      // Fallback
    }

    const cleanDirect = cleanArchiveFilename(url);
    return `/api/pdf-proxy?url=${encodeURIComponent(cleanDirect)}`;
  }

  // 2. Direct Archive.org storage node link
  if (url.includes('.archive.org/')) {
    const cleanDirect = cleanArchiveFilename(url);
    return `/api/pdf-proxy?url=${encodeURIComponent(cleanDirect)}`;
  }

  // 3. GitHub Blob URL: https://github.com/user/repo/blob/main/doc.pdf -> raw.githubusercontent.com
  const githubBlobMatch = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+\.pdf)$/i
  );
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
