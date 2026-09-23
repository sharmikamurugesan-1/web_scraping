import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ThumbsDown, ThumbsUp, Sparkles, AlertTriangle, ArrowRight, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function InsightsPage({ activeProductId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeProductId) return;
    setLoading(true);
    setError('');

    Promise.all([
      api.getProduct(activeProductId),
      api.getInsights(activeProductId),
      api.getSummary(activeProductId)
    ])
      .then(([prodRes, insRes, sumRes]) => {
        if (prodRes.success) setProduct(prodRes.product);
        if (insRes.success) setInsights(insRes.insights);
        if (sumRes.success) setAiSummary(sumRes.ai_summary);
      })
      .catch((err) => {
        setError("Failed to retrieve insights for the active product.");
      })
      .finally(() => setLoading(false));
  }, [activeProductId]);

  const handleFilterByAspect = (aspectTitle) => {
    // Extract aspect name or term
    const cleanAspect = aspectTitle.replace(' Feedback', '').replace(' Excellence', '').trim();
    navigate(`/reviews?aspect=${encodeURIComponent(cleanAspect)}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400">Mining Customer Intelligence & Synthesizing Insights...</p>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Insights Unavailable</h3>
        <p className="text-xs text-slate-400">{error || "Please select or analyze a product first."}</p>
      </div>
    );
  }

  const { pain_points = [], loved_features = [] } = insights;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-400">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Extractive Review Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Customer Insights & Strategic Takeaways
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Synthesized from analyzed verified reviews for <strong className="text-slate-200">{product?.name || 'Product'}</strong>
        </p>
      </div>

      {/* AI Review Summary Card */}
      {aiSummary && (
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 space-y-6 shadow-xl shadow-indigo-500/5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Executive AI Review Summary
                </h3>
                <span className="text-[11px] text-slate-400">
                  {aiSummary.engine}
                </span>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-medium border border-indigo-500/30">
              Stability: {aiSummary.sentiment_stability}
            </span>
          </div>

          {/* Verdict Quote */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 leading-relaxed font-medium italic">
            &quot;{aiSummary.executive_verdict}&quot;
          </div>

          {/* 2-Column Summary Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Core Strengths */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <ThumbsUp className="w-4 h-4" />
                <span>Consensus Strengths</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {aiSummary.core_strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recurring Complaints */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <ThumbsDown className="w-4 h-4" />
                <span>Recurring Complaints & Friction</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {aiSummary.recurring_complaints.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-rose-950/20 p-2.5 rounded-lg border border-rose-500/20">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Buying Recommendation */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-400">
              <strong className="text-white">Recommendation:</strong> {aiSummary.buying_recommendation}
            </span>
          </div>
        </div>
      )}

      {/* Top Customer Pain Points & What Customers Love Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Customer Pain Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <ThumbsDown className="w-5 h-5" />
              <h3>Top Customer Pain Points</h3>
            </div>
            <span className="text-xs text-slate-400">{pain_points.length} friction zones</span>
          </div>

          <div className="space-y-3">
            {pain_points.map((point, idx) => (
              <div
                key={idx}
                onClick={() => handleFilterByAspect(point.title)}
                className="glass-card p-5 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-3 hover:border-rose-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                    {point.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    point.severity === 'High'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {point.severity} Severity
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {point.description}
                </p>

                {point.sample_quote && (
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                    &quot;{point.sample_quote}&quot;
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{point.mention_count} reviews affected</span>
                  <span className="text-rose-400 flex items-center gap-1 group-hover:underline">
                    Filter reviews <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What Customers Love */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <ThumbsUp className="w-5 h-5" />
              <h3>What Customers Love</h3>
            </div>
            <span className="text-xs text-slate-400">{loved_features.length} drivers</span>
          </div>

          <div className="space-y-3">
            {loved_features.map((loved, idx) => (
              <div
                key={idx}
                onClick={() => handleFilterByAspect(loved.title)}
                className="glass-card p-5 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3 hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {loved.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {loved.impact} Impact
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {loved.description}
                </p>

                {loved.sample_quote && (
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                    &quot;{loved.sample_quote}&quot;
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{loved.mention_count} customer praises</span>
                  <span className="text-emerald-400 flex items-center gap-1 group-hover:underline">
                    Filter reviews <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
