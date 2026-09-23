import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const LOADING_STAGES = [
  "Initializing headless Chrome browser...",
  "Navigating to product review feed...",
  "Extracting verified customer comments & star ratings...",
  "Sanitizing text corpus and preserving critical negations...",
  "Running VADER NLP polarity classification engine...",
  "Aggregating aspect metrics and synthesizing dashboard..."
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [source, setSource] = useState('Amazon');
  const [queryOrUrl, setQueryOrUrl] = useState('');
  const [maxReviews, setMaxReviews] = useState(35);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPresets()
      .then((data) => {
        if (data.presets) setPresets(data.presets);
      })
      .catch((err) => console.error("Error loading presets:", err));
  }, []);

  // Stage progress animation timer while loading
  useEffect(() => {
    let timer;
    if (loading) {
      setStageIndex(0);
      timer = setInterval(() => {
        setStageIndex((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleAnalyze = async (overrideTarget = null, overrideSource = null) => {
    const target = overrideTarget || queryOrUrl;
    const selectedSource = overrideSource || source;

    if (!target.trim()) {
      setError("Please enter a product URL, search query, or select a preset.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.analyzeProduct({
        query_or_url: target,
        source: selectedSource,
        max_reviews: maxReviews,
      });

      if (response.success && response.product?.id) {
        navigate(`/dashboard/${response.product.id}`);
      } else {
        setError(response.error || "Failed to analyze product.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error contacting analysis service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Review Scraper & Sentiment Analyzer</h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Enter an e-commerce product URL, search query, or click a verified demo preset below for instant evaluation.
        </p>
      </div>

      {/* Main Analysis Form Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Source Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            1. Select E-Commerce Platform
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setSource('Amazon')}
              className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-semibold text-sm transition-all ${
                source === 'Amazon'
                  ? 'bg-brand-600/20 border-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Amazon Reviews</span>
            </button>

            <button
              type="button"
              onClick={() => setSource('Flipkart')}
              className={`p-3.5 rounded-xl border flex items-center justify-center gap-2.5 font-semibold text-sm transition-all ${
                source === 'Flipkart'
                  ? 'bg-brand-600/20 border-brand-500 text-white shadow-md shadow-brand-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span>Flipkart Reviews</span>
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            2. Enter Product URL or Search Keyword
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              disabled={loading}
              value={queryOrUrl}
              onChange={(e) => setQueryOrUrl(e.target.value)}
              placeholder={`Paste an ${source} product link (e.g. https://www.${source.toLowerCase()}.com/...) or enter keyword (e.g. Sony XM5)`}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
            />
          </div>
        </div>

        {/* Review Limit & Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Sample Depth:</span>
            <div className="flex items-center gap-1.5">
              {[20, 35, 50, 75].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setMaxReviews(count)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    maxReviews === count
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {count} reviews
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleAnalyze()}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-md shadow-brand-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scrape & Analyze Sentiment</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Animated Progress Loader Bar */}
        {loading && (
          <div className="p-5 rounded-xl bg-slate-900/90 border border-brand-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-brand-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                Stage {stageIndex + 1} of {LOADING_STAGES.length}: {LOADING_STAGES[stageIndex]}
              </span>
              <span className="font-mono text-slate-400">
                {Math.round(((stageIndex + 1) / LOADING_STAGES.length) * 100)}%
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 transition-all duration-500"
                style={{ width: `${((stageIndex + 1) / LOADING_STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Quick Demo Presets */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              1-Click Demo Presets
            </h3>
            <p className="text-xs text-slate-400">
              Instant evaluation datasets with 40+ authentic customer reviews, ratings, and aspects
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
            Zero Waiting
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between hover:border-brand-500/40 transition-all group"
            >
              <div className="flex items-start gap-3">
                <img
                  src={preset.image_url}
                  alt={preset.name}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-700/80 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {preset.source}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-tight">
                    {preset.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-amber-400 font-bold">★ {preset.rating}</span>
                    <span>•</span>
                    <span>{preset.review_count} reviews</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAnalyze(preset.id, preset.source)}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-brand-600 text-slate-200 hover:text-white border border-slate-800 hover:border-brand-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Instant Analyze</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
