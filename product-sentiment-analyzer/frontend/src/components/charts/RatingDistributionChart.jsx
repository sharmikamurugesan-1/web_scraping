import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RatingDistributionChart({ distribution = [] }) {
  // Sort from 5 Star down to 1 Star
  const sorted = [...distribution].reverse();

  const getBarColor = (starsLabel) => {
    if (starsLabel.includes('5')) return '#10b981';
    if (starsLabel.includes('4')) return '#34d399';
    if (starsLabel.includes('3')) return '#f59e0b';
    if (starsLabel.includes('2')) return '#fb923c';
    return '#f43f5e';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="font-semibold text-slate-200">{data.stars}</p>
          <p className="text-slate-400">
            {data.count} reviews ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={sorted} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
          <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis dataKey="stars" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={getBarColor(entry.stars)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
