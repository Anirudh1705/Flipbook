import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Read high-performance digital publications, magazines, and reports in our interactive flipbook reader.',
  image = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
  canonicalUrl,
}) => {
  useEffect(() => {
    // Set document title
    document.title = title ? `${title} | Digital Library` : 'Digital Flipbook Library';

    // Helper to set meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (isProperty) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    if (canonicalUrl) {
      let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.setAttribute('rel', 'canonical');
        document.head.appendChild(linkEl);
      }
      linkEl.setAttribute('href', canonicalUrl);
    }
  }, [title, description, image, canonicalUrl]);

  return null;
};
