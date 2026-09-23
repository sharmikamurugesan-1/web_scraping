import React from 'react';
import { Sparkles, Database, Cpu, Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-200">Sentilytics AI</p>
              <p className="text-xs text-slate-500">Product Sentiment Intelligence & Review Analytics</p>
            </div>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-brand-400" /> VADER NLP Engine
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> SQLite / MongoDB Atlas
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Flask & React 18
            </span>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Sentilytics AI. Built for enterprise intelligence & research benchmarking.
          </p>
        </div>
      </div>
    </footer>
  );
}
