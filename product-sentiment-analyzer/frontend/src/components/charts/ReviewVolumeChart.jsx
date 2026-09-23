import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function ReviewVolumeChart({ trendData = [] }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        Insufficient volume data.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1 shadow-xl">
          <p className="font-semibold text-slate-200">{label}</p>
          <p className="text-brand-400 font-mono">Volume: {data.volume} reviews</p>
          <p className="text-slate-400">Avg Sentiment: {data.avg_sentiment}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => (val.length > 5 ? val.slice(-5) : val)}
          />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="volume" fill="#818cf8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
