import React from 'react';
import { ThumbsUp, ThumbsDown, Hash } from 'lucide-react';

export default function WordCloud({ wordFrequencies = [], posWords = [], negWords = [], onSelectWord }) {
  if (wordFrequencies.length === 0 && posWords.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No keywords extracted from the review corpus.
      </div>
    );
  }

  // Calculate size scale based on max count
  const maxCount = Math.max(...wordFrequencies.map((w) => w.value), 1);

  return (
    <div className="space-y-6">
      {/* Top Positive & Negative Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Positive Drivers */}
        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ThumbsUp className="w-4 h-4" />
            <span>Top Positive Drivers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {posWords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectWord && onSelectWord(item.word)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <span>{item.word}</span>
                <span className="text-[10px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  {item.count}
                </span>
              </button>
            ))}
            {posWords.length === 0 && (
              <span className="text-xs text-slate-500">No positive keywords isolated.</span>
            )}
          </div>
        </div>

        {/* Negative Drivers */}
        <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <ThumbsDown className="w-4 h-4" />
            <span>Top Pain Points & Critique</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {negWords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectWord && onSelectWord(item.word)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <span>{item.word}</span>
                <span className="text-[10px] px-1 rounded bg-rose-500/20 text-rose-300 font-mono">
                  {item.count}
                </span>
              </button>
            ))}
            {negWords.length === 0 && (
              <span className="text-xs text-slate-500">No negative critique keywords isolated.</span>
            )}
          </div>
        </div>
      </div>

      {/* Global Vocabulary Cloud */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
          <Hash className="w-4 h-4 text-brand-400" />
          <span>High Frequency Product Vocabulary</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          {wordFrequencies.map((item, idx) => {
            const ratio = item.value / maxCount;
            const fontSize = Math.max(12, Math.min(22, 12 + ratio * 12));
            return (
              <button
                key={idx}
                onClick={() => onSelectWord && onSelectWord(item.text)}
                style={{ fontSize: `${fontSize}px` }}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-brand-600/30 text-slate-300 hover:text-brand-300 border border-slate-700/60 transition-all cursor-pointer font-medium"
              >
                {item.text}{' '}
                <span className="text-[10px] text-slate-400 opacity-70 font-mono">({item.value})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
