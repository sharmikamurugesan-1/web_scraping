import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, Info } from 'lucide-react';

export default function HealthScoreCard({ healthData }) {
  if (!healthData) return null;

  const { score = 0, status = 'Healthy', grade = 'A', factors = [], disclaimer } = healthData;

  const getStatusColor = (st) => {
    if (st === 'Exceptional' || st === 'Healthy') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (st === 'Moderate') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getProgressColor = (name) => {
    if (name.includes('Rating')) return 'bg-amber-400';
    if (name.includes('Positive')) return 'bg-emerald-400';
    if (name.includes('Negative')) return 'bg-rose-400';
    if (name.includes('Volume')) return 'bg-indigo-400';
    return 'bg-brand-400';
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Product Health Score</h3>
            <p className="text-[11px] text-slate-400">Algorithmic marketplace satisfaction assessment</p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${getStatusColor(status)}`}>
          <span>Grade: {grade}</span>
          <span>•</span>
          <span>{status}</span>
        </div>
      </div>

      {/* Main Score & Factor Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Big Circular/Numeric Display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <span className="text-5xl font-black text-white tracking-tight font-mono">
            {score}
          </span>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">
            Out of 100
          </span>
          <span className="text-[11px] text-brand-400 mt-2 font-medium">
            Status: {status}
          </span>
        </div>

        {/* Contributing Factors */}
        <div className="md:col-span-8 space-y-2.5">
          {factors.map((factor, idx) => {
            const percent = Math.min(100, Math.max(0, (factor.score / factor.max) * 100));
            return (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">{factor.name}</span>
                  <span className="font-mono text-slate-400">
                    {factor.score} / {factor.max} pts
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(factor.name)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <span>
          {disclaimer || "Application-defined analytical score derived from rating, sentiment polarity, and review consistency. Not scientifically validated."}
        </span>
      </div>
    </div>
  );
}
