import React from 'react';
import { BookOpen, Sparkles, Layers, Cpu, Database } from 'lucide-react';

interface HeroProps {
  totalBooks: number;
  categoriesCount: number;
}

export const Hero: React.FC<HeroProps> = ({ totalBooks, categoriesCount }) => {
  return (
    <div className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20 border-b border-slate-900">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-brand-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-10 w-80 h-80 bg-brand-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>High-Performance Digital Publication Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Digital Publication <br />
            <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Flipbook Library
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Explore our curated catalog of magazines, annual reports, academic journals, and whitepapers. Engineered to render 300–500 MB documents seamlessly without high memory overhead.
          </p>

          {/* Key Metrics / Highlights */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-brand-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">{totalBooks}</span>
              </div>
              <p className="text-xs text-slate-400">Publications</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">{categoriesCount}</span>
              </div>
              <p className="text-xs text-slate-400">Disciplines</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-teal-400 mb-1">
                <Cpu className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">64 KB</span>
              </div>
              <p className="text-xs text-slate-400">Byte Range</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                <Database className="w-4 h-4" />
                <span className="text-xs font-mono font-bold">&lt; 10 GB</span>
              </div>
              <p className="text-xs text-slate-400">R2 Storage Cap</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
