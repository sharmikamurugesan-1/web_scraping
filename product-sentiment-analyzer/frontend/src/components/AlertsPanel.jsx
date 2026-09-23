import React from 'react';
import { Bell, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function AlertsPanel({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  const getAlertBadge = (status) => {
    if (status === 'CRITICAL') {
      return (
        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold font-mono">
          CRITICAL
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono">
          WARNING
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
        NORMAL
      </span>
    );
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Automated Sentiment & Quality Alerts</h3>
            <p className="text-[11px] text-slate-400">Rule-based monitors evaluating consumer sentiment boundaries</p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
          {alerts.length} Rules Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border transition-all ${
              alert.status === 'CRITICAL'
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : alert.status === 'WARNING'
                ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h4 className="text-xs font-bold text-white truncate">{alert.name}</h4>
              {getAlertBadge(alert.status)}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              {alert.message}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono">
              <span>Threshold: {alert.threshold}</span>
              <span className="font-bold text-slate-200">Current: {alert.current_value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
