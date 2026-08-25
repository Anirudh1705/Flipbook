import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { logoutFromFirebase } from '../../lib/firebase';
import { STORAGE_KEYS } from '../../lib/config';

interface AdminLayoutProps {
  children: React.ReactNode;
  onOpenAddModal?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  onOpenAddModal,
}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutFromFirebase();
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }

    localStorage.removeItem('flipbook_admin_authenticated');
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_EMAIL);
    navigate('/admin/login');
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
            <span>Public Portal</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-100 leading-tight">Admin Dashboard</h1>
              <p className="text-[10px] text-slate-400 font-mono">Publication Manager</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition-colors shadow-sm shadow-brand-500/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>+ Add PDF</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs transition-colors"
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

      {/* Admin Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Developed by{' '}
        <a
          href="https://www.linkedin.com/in/anirudh8760/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-brand-400 underline underline-offset-2 transition-colors font-medium"
        >
          Anirudh
        </a>
      </footer>
    </div>
  );
};
