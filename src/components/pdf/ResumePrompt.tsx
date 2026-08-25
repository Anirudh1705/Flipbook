import React from 'react';
import { BookmarkCheck, ArrowRight, X } from 'lucide-react';
import type { ReadingProgress } from '../../types/book';

interface ResumePromptProps {
  progress: ReadingProgress;
  onResume: (pageNumber: number) => void;
  onDismiss: () => void;
}

export const ResumePrompt: React.FC<ResumePromptProps> = ({
  progress,
  onResume,
  onDismiss,
}) => {
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] sm:w-auto animate-in slide-in-from-top-4 duration-300">
      <div className="glass-toolbar p-3.5 sm:p-4 rounded-2xl border border-brand-500/40 shadow-2xl shadow-brand-500/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-100">
              Continue reading from page {progress.pageNumber}?
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Saved progress ({progress.pageNumber} / {progress.totalPages || '?'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onResume(progress.pageNumber)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            <span>Resume</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Start from beginning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
