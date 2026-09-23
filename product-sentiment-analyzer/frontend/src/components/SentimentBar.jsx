import React from 'react';

export default function SentimentBar({ score = 0, showLabels = false }) {
  // Score is between -1.0 and +1.0
  const clamped = Math.max(-1, Math.min(1, Number(score) || 0));
  // Convert -1..+1 to 0..100%
  const percentage = ((clamped + 1) / 2) * 100;

  const colorClass =
    clamped >= 0.05
      ? 'bg-emerald-500 shadow-emerald-500/50'
      : clamped <= -0.05
      ? 'bg-rose-500 shadow-rose-500/50'
      : 'bg-amber-500 shadow-amber-500/50';

  return (
    <div className="w-full">
      <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        {/* Background gradient from red to yellow to green */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/30 via-amber-500/30 to-emerald-500/30 opacity-70" />
        
        {/* Center Zero Marker */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-600 z-10" />

        {/* Polarity Needle Indicator */}
        <div
          className={`absolute top-0 bottom-0 w-2.5 -ml-1 rounded-full ${colorClass} shadow-md transition-all duration-300 z-20`}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {showLabels && (
        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
          <span>-1.0 (Strong Neg)</span>
          <span className="text-slate-400 font-bold">{clamped > 0 ? `+${clamped.toFixed(2)}` : clamped.toFixed(2)}</span>
          <span>+1.0 (Strong Pos)</span>
        </div>
      )}
    </div>
  );
}
