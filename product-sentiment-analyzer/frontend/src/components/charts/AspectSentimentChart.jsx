import React from 'react';
import { Battery, Shield, Tv, Zap, Camera, Volume2, DollarSign } from 'lucide-react';
import SentimentBadge from '../SentimentBadge';

const aspectIcons = {
  'Battery & Power': Battery,
  'Build & Design': Shield,
  'Display & Screen': Tv,
  'Performance & Speed': Zap,
  'Camera & Optics': Camera,
  'Sound & Audio': Volume2,
  'Value for Money': DollarSign,
};

export default function AspectSentimentChart({ aspects = [] }) {
  if (!aspects || aspects.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No specific product aspect mentions detected in this review sample.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {aspects.map((item, idx) => {
        const IconComponent = aspectIcons[item.aspect] || Zap;
        return (
          <div key={idx} className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.aspect}</h4>
                  <span className="text-xs text-slate-400">{item.mention_count} mentions</span>
                </div>
              </div>

              <SentimentBadge sentiment={item.overall} score={item.avg_sentiment} size="sm" />
            </div>

            {/* Segmented bar for positive / neutral / negative */}
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-slate-800 flex overflow-hidden">
                <div
                  style={{ width: `${item.pos_percent}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title={`Positive: ${item.pos_percent}%`}
                />
                <div
                  style={{ width: `${item.neu_percent}%` }}
                  className="bg-amber-500 h-full transition-all duration-300"
                  title={`Neutral: ${item.neu_percent}%`}
                />
                <div
                  style={{ width: `${item.neg_percent}%` }}
                  className="bg-rose-500 h-full transition-all duration-300"
                  title={`Negative: ${item.neg_percent}%`}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span className="text-emerald-400 font-medium">{item.pos_percent}% Pos</span>
                <span className="text-amber-400 font-medium">{item.neu_percent}% Neu</span>
                <span className="text-rose-400 font-medium">{item.neg_percent}% Neg</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
