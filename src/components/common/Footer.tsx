import React from 'react';
import { BookOpen, ShieldCheck, Zap, Server, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-850 bg-slate-950 text-slate-400 text-sm mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-brand-400" />
              </div>
              <span className="font-bold text-slate-100 tracking-tight text-base">
                DIGITAL FLIPBOOK LIBRARY
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              A high-performance digital reader engineered specifically for 300–500 MB publications. Powered by Mozilla PDF.js, HTTP Range Byte-Streaming, Cloudflare R2, and Supabase PostgreSQL.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Architecture Stack</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>PDF.js 64KB HTTP Range Stream</span>
              </li>
              <li className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                <span>Cloudflare R2 Object Storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloudflare Pages SPA Edge</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Supabase PostgreSQL + RLS</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 text-sm mb-3">Technical Highlights</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>• Virtualized IntersectionObserver Sidebar</li>
              <li>• Dual-Page Spread + Spine Shading</li>
              <li>• Mobile Swipe & Pinch-to-Zoom</li>
              <li>• In-Document Text Search</li>
              <li>• Local Memory Progress Sync</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Digital Flipbook Library. Engineered for high-capacity publications.</p>
          <div className="flex items-center gap-4">
            <span>Accept-Ranges: bytes</span>
            <span>•</span>
            <span>Zero-Buffer Startup</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
