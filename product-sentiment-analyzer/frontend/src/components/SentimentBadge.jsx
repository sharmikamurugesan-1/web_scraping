import React from 'react';
import { ThumbsUp, Minus, ThumbsDown } from 'lucide-react';

export default function SentimentBadge({ sentiment, score, showScore = true, size = 'md' }) {
  const isPos = sentiment === 'Positive' || sentiment === 'positive';
  const isNeg = sentiment === 'Negative' || sentiment === 'negative';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size] || 'text-xs px-2.5 py-1 gap-1.5';

  if (isPos) {
    return (
      <span className={`inline-flex items-center rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
        <span>Positive</span>
        {showScore && score !== undefined && (
          <span className="opacity-80 font-mono text-[10px]">({Number(score).toFixed(2)})</span>
        )}
      </span>
    );
  }

  if (isNeg) {
    return (
      <span className={`inline-flex items-center rounded-full font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
        <ThumbsDown className="w-3.5 h-3.5 text-rose-400" />
        <span>Negative</span>
        {showScore && score !== undefined && (
          <span className="opacity-80 font-mono text-[10px]">({Number(score).toFixed(2)})</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
      <Minus className="w-3.5 h-3.5 text-amber-400" />
      <span>Neutral</span>
      {showScore && score !== undefined && (
        <span className="opacity-80 font-mono text-[10px]">({Number(score).toFixed(2)})</span>
      )}
    </span>
  );
}
