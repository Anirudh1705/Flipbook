import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, ArrowLeft, Cloud, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
  onOpenR2Guide?: () => void;
  onOpenAddModal?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  onOpenR2Guide,
  onOpenAddModal,
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-40 h-16 glass-toolbar border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Library</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-100 leading-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-slate-400 font-mono">Publication Manager & R2 Storage</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenR2Guide && (
            <button
              onClick={onOpenR2Guide}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">R2 Setup Guide</span>
            </button>
          )}

          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition-colors shadow-sm shadow-brand-500/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>+ Add Publication</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
