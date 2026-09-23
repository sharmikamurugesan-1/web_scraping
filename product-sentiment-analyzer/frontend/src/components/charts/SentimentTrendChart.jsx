import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

export default function SentimentTrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Insufficient time-series data for trend analysis.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-3 rounded-lg shadow-xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">{label}</p>
          <p className="text-emerald-400 font-mono">
            Avg Polarity: {data.avg_sentiment > 0 ? `+${data.avg_sentiment}` : data.avg_sentiment}
          </p>
          <p className="text-slate-400">Volume: {data.volume} reviews</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => (val.length > 5 ? val.slice(-5) : val)}
          />
          <YAxis
            domain={[-1, 1]}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            ticks={[-1, -0.5, 0, 0.5, 1]}
          />
          <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="avg_sentiment"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#sentimentGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
