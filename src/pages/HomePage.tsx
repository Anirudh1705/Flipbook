import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { SEO } from '../components/common/SEO';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('flipbook_admin_authenticated') === 'true');
  }, []);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = accessCode.trim().toLowerCase();
    if (clean) {
      navigate(`/book/${clean}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-slate-950 relative overflow-hidden">
      <SEO
        title="Digital Publication Portal | Secure Flipbook Reader"
        description="Access your dedicated publication using your direct link or publication access ID."
      />

      {/* Decorative ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-slate-800/80 glass-toolbar py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>Flipbook Pro</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Secure Reader
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Direct Publication Gateway</div>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              <span>Admin Portal</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Access Portal Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-3xl mx-auto w-full text-center space-y-8 my-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-slate-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>High-Performance 300–500 MB PDF Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Digital Publication <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-teal-300 to-indigo-400">
              Interactive Flipbook Reader
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Each publication is accessible via its unique private URL. Enter your publication ID below or use your direct access link.
          </p>
        </div>

        {/* Access Form */}
        <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-left">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Direct Publication ID / Code
          </label>

          <form onSubmit={handleAccessSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
                placeholder="e.g. 01, 02, or publication-slug"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 font-mono text-sm placeholder:text-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition-all shrink-0"
              >
                <span>Open</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Sample links:</span>
            <div className="flex gap-1.5">
              <Link
                to="/book/01"
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-brand-400 border border-slate-800 font-mono"
              >
                /book/01
              </Link>
              <Link
                to="/book/02"
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-brand-400 border border-slate-800 font-mono"
              >
                /book/02
              </Link>
              <Link
                to="/book/03"
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-brand-400 border border-slate-800 font-mono"
              >
                /book/03
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Pill Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Unique Direct URLs</div>
              <div className="text-[11px] text-slate-500">Every PDF has its own isolated link</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Instant Continuous Scroll</div>
              <div className="text-[11px] text-slate-500">Natural vertical scrolling & spread modes</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-slate-200">Admin Control</div>
              <div className="text-[11px] text-slate-500">Central management of all 25+ PDFs</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-850 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Flipbook Pro • Powered by Cloudflare R2 & Mozilla PDF.js Byte-Range Streaming
      </footer>
    </div>
  );
};
