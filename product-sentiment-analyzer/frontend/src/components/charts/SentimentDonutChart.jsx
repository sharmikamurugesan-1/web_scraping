import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function SentimentDonutChart({ data, percentages }) {
  const chartData = [
    { name: 'Positive', value: data?.positive || 0, color: '#10b981', percentage: percentages?.positive || 0 },
    { name: 'Neutral', value: data?.neutral || 0, color: '#f59e0b', percentage: percentages?.neutral || 0 },
    { name: 'Negative', value: data?.negative || 0, color: '#f43f5e', percentage: percentages?.negative || 0 },
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs">
          <p className="font-semibold text-slate-200">{item.name}</p>
          <p className="text-slate-400">
            {item.value} reviews ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center Statistic */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-extrabold text-white tracking-tight">{total}</span>
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Analyzed</span>
      </div>
    </div>
  );
}
