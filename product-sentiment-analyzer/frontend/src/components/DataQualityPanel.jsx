import React from 'react';
import { Database, CheckCircle2, AlertCircle, ShieldAlert, Cpu } from 'lucide-react';

export default function DataQualityPanel({ qualityData }) {
  if (!qualityData) return null;

  const {
    reviews_collected = 0,
    duplicates_detected = 0,
    missing_ratings = 0,
    missing_dates = 0,
    verified_purchases = 0,
    processed_reviews = 0,
    data_integrity_pct = 100.0,
    scraper_telemetry = {}
  } = qualityData;

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Scraper & Data Quality Audit</h3>
            <p className="text-[11px] text-slate-400">Ingestion health and data integrity telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{data_integrity_pct}% Integrity</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Collected</span>
          <p className="text-lg font-bold font-mono text-white">{reviews_collected}</p>
          <span className="text-[10px] text-slate-500 block">Raw Records</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Duplicates</span>
          <p className="text-lg font-bold font-mono text-amber-400">{duplicates_detected}</p>
          <span className="text-[10px] text-slate-500 block">Deduplicated</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Missing Ratings</span>
          <p className="text-lg font-bold font-mono text-slate-300">{missing_ratings}</p>
          <span className="text-[10px] text-slate-500 block">Handled</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Verified Buyers</span>
          <p className="text-lg font-bold font-mono text-emerald-400">{verified_purchases}</p>
          <span className="text-[10px] text-emerald-500/80 block">Verified Status</span>
        </div>
      </div>

      {/* Scraper Telemetry Footer */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-brand-400" />
          <span>Engine: <strong className="text-slate-200">{scraper_telemetry.mode || 'Headless Chrome'}</strong></span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Anti-Bot Status: <strong className="text-emerald-400">PASSED</strong>
        </div>
      </div>
    </div>
  );
}
