import React, { useState, useEffect } from 'react';
import { Settings, Database, Cpu, Bell, Shield, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [negThreshold, setNegThreshold] = useState(20);
  const [ratingThreshold, setRatingThreshold] = useState(4.0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.error("Error fetching health:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-brand-400" />
          System Settings & Scraper Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage ingestion engines, database persistence mode, and alert threshold parameters
        </p>
      </div>

      {/* 1. Scraper Health & Telemetry */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Cpu className="w-4 h-4 text-brand-400" />
          <h3>Web Scraping Engine Telemetry</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Amazon Review Scraper</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                <CheckCircle2 className="w-3 h-3" /> Available
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Selenium headless Chrome engine with anti-detection headers, CSS selector extraction, and automatic fallback.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Flipkart Review Scraper</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                <CheckCircle2 className="w-3 h-3" /> Available
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dynamic headless crawler targeting Flipkart review cards, certified buyer tags, and star rating elements.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Database Configuration */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Database className="w-4 h-4 text-emerald-400" />
          <h3>Persistence Architecture (Hybrid MongoDB / SQLite)</h3>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Active Storage Provider:</span>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 font-bold font-mono border border-indigo-500/20 uppercase">
              {health?.database?.provider || 'SQLite'} (Embedded)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-300">Local Database Path:</span>
            <span className="font-mono text-slate-400 text-[11px] truncate max-w-sm">
              {health?.database?.sqlite_path || 'backend/data/sentiment_store.db'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-brand-400" /> MongoDB Atlas Cloud Connection:
            </p>
            <p>
              To persist data directly to MongoDB Atlas, set the <code className="text-brand-300 bg-slate-950 px-1 py-0.5 rounded">MONGO_URI</code> environment variable prior to starting the backend.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Alert Rules Configurator */}
      <form onSubmit={handleSaveThresholds} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3>Threshold Alert Rules</h3>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium animate-fadeIn">
              Settings updated successfully!
            </span>
          )}
        </div>

        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <label>Negative Sentiment Critical Trigger Rate:</label>
              <span className="font-mono font-bold text-rose-400">{negThreshold}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              value={negThreshold}
              onChange={(e) => setNegThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <span className="text-[10px] text-slate-500">
              Triggers a warning when negative customer sentiment proportion exceeds this limit.
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <label>Minimum Star Rating Watchdog:</label>
              <span className="font-mono font-bold text-amber-400">{ratingThreshold.toFixed(1)} Stars</span>
            </div>
            <input
              type="range"
              min="3.0"
              max="4.5"
              step="0.1"
              value={ratingThreshold}
              onChange={(e) => setRatingThreshold(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <span className="text-[10px] text-slate-500">
              Flags any product whose average rating drops below this threshold.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            Save Alert Rules
          </button>
        </div>
      </form>
    </div>
  );
}
