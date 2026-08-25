import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Shield, Library, Sparkles } from 'lucide-react';

interface HeaderProps {
  onSearchFocus?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full glass-toolbar border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-400 group-hover:text-brand-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FLIPBOOK
              </span>
              <span className="text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-wide font-mono hidden sm:block">Digital Publication Library</p>
          </div>
        </Link>

        {/* Right Navigation */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Library className="w-4 h-4" />
            <span className="hidden sm:inline">Library</span>
          </Link>

          <Link
            to="/admin"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              isAdmin
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Admin Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Range-Streaming 64KB</span>
          </div>
        </div>
      </div>
    </header>
  );
};
