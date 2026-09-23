import React from 'react';
import { X, Star, CheckCircle2, Calendar, User, ShoppingCart, Layers, ExternalLink } from 'lucide-react';
import SentimentBadge from './SentimentBadge';
import SentimentBar from './SentimentBar';

export default function ReviewDetailModal({ review, onClose }) {
  if (!review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {review.source || 'Amazon'}
              </span>
              <SentimentBadge sentiment={review.sentiment} score={review.sentiment_score} size="md" />
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Review Details & NLP Breakdown
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-white">{review.reviewer || 'Customer'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{review.review_date || 'Recent'}</span>
          </div>

          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.round(Number(review.rating || 5))
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
            <span className="ml-1 font-bold text-slate-200">
              {Number(review.rating || 5).toFixed(1)}
            </span>
          </div>

          {review.verified_purchase && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Verified Purchase
            </span>
          )}
        </div>

        {/* Full Review Text */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Review Commentary
          </label>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 text-sm text-slate-200 leading-relaxed italic">
            &quot;{review.review_text}&quot;
          </div>
        </div>

        {/* Polarity Slider & Weight Components */}
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">VADER Polarity Intensity</span>
            <span className="font-mono text-brand-400 font-bold">
              Score: {review.sentiment_score > 0 ? `+${review.sentiment_score}` : review.sentiment_score}
            </span>
          </div>
          <SentimentBar score={review.sentiment_score} showLabels={true} />

          <div className="grid grid-cols-3 gap-2 text-center pt-2 text-xs">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block">Positive</span>
              <span className="font-mono font-bold text-emerald-400">{review.pos_score}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-slate-400 block">Neutral</span>
              <span className="font-mono font-bold text-amber-400">{review.neu_score}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] text-slate-400 block">Negative</span>
              <span className="font-mono font-bold text-rose-400">{review.neg_score}</span>
            </div>
          </div>
        </div>

        {/* Detected Aspects */}
        {review.aspects && review.aspects.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              Detected Product Dimensions
            </label>
            <div className="flex flex-wrap gap-2">
              {review.aspects.map((asp, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
                >
                  {asp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
