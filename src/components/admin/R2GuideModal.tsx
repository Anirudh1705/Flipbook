import React, { useState } from 'react';
import { X, Cloud, Check, Copy, Terminal, ShieldAlert } from 'lucide-react';

interface R2GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const R2GuideModal: React.FC<R2GuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedCors, setCopiedCors] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  if (!isOpen) return null;

  const corsConfig = `[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["Range", "Content-Range", "Content-Type", "Accept-Ranges"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]`;

  const curlTestCommand = `curl -I -H "Range: bytes=0-65535" https://your-r2-domain.com/books/book-01.pdf`;

  const handleCopy = (text: string, type: 'cors' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'cors') {
      setCopiedCors(true);
      setTimeout(() => setCopiedCors(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-3xl w-full glass-toolbar p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Cloudflare R2 & Large PDF Setup Guide</h2>
              <p className="text-xs text-slate-400">Zero-egress hosting for 300–500 MB PDF publications</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Security Best Practice:</span> Never expose your R2 Access Key ID or Secret Access Key in client-side code. The browser only needs the public or custom domain PDF URL to stream byte ranges!
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-mono">1</span>
              <span>Create Bucket in Cloudflare R2</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Log in to the Cloudflare Dashboard → <strong>R2 Object Storage</strong> → <strong>Create bucket</strong> (e.g. <code className="text-brand-300 font-mono">digital-library-books</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-mono">2</span>
                <span>Configure CORS Policy (Crucial for Range Requests)</span>
              </h3>
              <button
                onClick={() => handleCopy(corsConfig, 'cors')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
              >
                {copiedCors ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCors ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <p className="text-slate-400">
              In your Bucket Settings → <strong>CORS Policy</strong>, paste this JSON configuration:
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
              {corsConfig}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-mono">3</span>
              <span>Enable Public Access or Custom Domain</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Under Bucket Settings → <strong>Public Development URL</strong> (or connect your custom subdomain like <code className="text-sky-400 font-mono">cdn.yourlibrary.com</code>).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-mono">4</span>
                <span>Validate Range Request Support</span>
              </h3>
              <button
                onClick={() => handleCopy(curlTestCommand, 'curl')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono transition-colors"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <p className="text-slate-400">
              Run this cURL test in your terminal to verify that your R2 URL returns <strong className="text-brand-300">HTTP 206 Partial Content</strong>:
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
              <Terminal className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{curlTestCommand}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
