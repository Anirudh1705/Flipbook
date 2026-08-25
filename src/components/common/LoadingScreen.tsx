import React from 'react';
import { BookOpen, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoadingScreenProps {
  progress?: number; // -1 for indeterminate, 0-100 for actual
  stageText?: string;
  error?: string | null;
  onRetry?: () => void;
  title?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress = -1,
  stageText = 'Preparing document...',
  error = null,
  onRetry,
  title,
}) => {
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-red-500/20 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Unable to Open Publication</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-left space-y-1 font-mono">
            <div className="text-slate-300 font-semibold">Troubleshooting checklist:</div>
            <div>• Check your network connection</div>
            <div>• If using an external URL, ensure the link is direct & accessible</div>
            <div>• If uploaded locally, you can re-upload from Admin Dashboard</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-semibold text-sm transition-colors shadow-lg shadow-brand-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            )}
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Library Home</span>
            </Link>
            <Link
              to="/admin"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 font-medium text-sm border border-slate-800 transition-colors"
            >
              <span>Admin Hub</span>
            </Link>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 font-mono">
            Developed by{' '}
            <a
              href="https://www.linkedin.com/in/anirudh8760/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-brand-400 underline underline-offset-2 transition-colors font-medium"
            >
              Anirudh
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-2xl bg-brand-500/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-brand-600/30 to-emerald-400/20 border border-brand-500/40 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-brand-400 animate-bounce" />
          </div>
        </div>

        <div>
          {title && (
            <h3 className="text-base font-semibold text-slate-200 line-clamp-1 mb-1">{title}</h3>
          )}
          <h2 className="text-xl font-bold text-slate-100">Opening Publication</h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">{stageText}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
            {progress >= 0 ? (
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-brand-500/50"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full w-1/3 bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" />
            )}
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
            <span>Progressive byte streaming</span>
            <span>{progress >= 0 ? `${progress}%` : 'Loading...'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 italic">
          Zero full-file download wait. Renders seamlessly as bytes are indexed.
        </p>

        <div className="pt-2 text-[11px] text-slate-500 font-mono">
          Developed by{' '}
          <a
            href="https://www.linkedin.com/in/anirudh8760/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-brand-400 underline underline-offset-2 transition-colors font-medium"
          >
            Anirudh
          </a>
        </div>
      </div>
    </div>
  );
};
