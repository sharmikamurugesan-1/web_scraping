import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { GitCompare, Star, Activity, Plus, Trash2, ArrowRight, Download, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import SentimentBadge from '../components/SentimentBadge';
import SentimentBar from '../components/SentimentBar';

export default function ComparisonPage() {
  const [searchParams] = useSearchParams();
  const initialP1 = searchParams.get('id1') || '';
  const initialP2 = searchParams.get('id2') || '';

  const [productsList, setProductsList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listProducts(100)
      .then((res) => {
        const list = res.products || [];
        setProductsList(list);

        const chosen = [];
        if (initialP1) chosen.push(initialP1);
        if (initialP2 && initialP2 !== initialP1) chosen.push(initialP2);

        if (chosen.length < 2 && list.length >= 2) {
          chosen.push(list[0].id);
          if (list[1] && !chosen.includes(list[1].id)) chosen.push(list[1].id);
        }
        setSelectedIds(chosen);
      })
      .catch((err) => console.error("Error loading products for compare:", err));
  }, []);

  const runComparison = async (idsToCompare = selectedIds) => {
    if (idsToCompare.length < 2) {
      setError("Please select at least 2 products to compare.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await api.compareProducts(idsToCompare);
      if (data.success) {
        setComparisonData(data);
      } else {
        setError(data.error || "Failed to compare products.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error executing multi-product comparison.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedIds.length >= 2) {
      runComparison(selectedIds);
    }
  }, [selectedIds]);

  const handleProductChange = (index, newId) => {
    const updated = [...selectedIds];
    updated[index] = newId;
    setSelectedIds(updated);
  };

  const handleAddThirdProduct = () => {
    const available = productsList.find((p) => !selectedIds.includes(p.id));
    if (available && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, available.id]);
    }
  };

  const handleRemoveProduct = (indexToRemove) => {
    if (selectedIds.length <= 2) return;
    setSelectedIds(selectedIds.filter((_, idx) => idx !== indexToRemove));
  };

  const getBadgeClass = (style) => {
    if (style === 'positive') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (style === 'negative') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    return 'bg-slate-800 text-slate-300 border border-slate-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-brand-400">
          <GitCompare className="w-3.5 h-3.5" />
          <span>Multi-Product Market Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Transparent Side-by-Side Product Comparison
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Compare 2 to 3 products across transparent metric dimensions, star ratings, and aspect feedback
        </p>
      </div>

      {/* Selectors Header Card */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select Products to Compare (2–3 items)
          </span>

          {selectedIds.length < 3 && productsList.length > selectedIds.length && (
            <button
              onClick={handleAddThirdProduct}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 3rd Product</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedIds.map((id, idx) => (
            <div key={idx} className="space-y-1.5 relative">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Product {String.fromCharCode(65 + idx)}</span>
                {selectedIds.length > 2 && (
                  <button
                    onClick={() => handleRemoveProduct(idx)}
                    className="text-slate-500 hover:text-rose-400"
                    title="Remove from comparison"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={id}
                onChange={(e) => handleProductChange(idx, e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 truncate"
              >
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.source}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Synthesizing Comparative Analytics...</p>
        </div>
      )}

      {/* Comparison Tables & Aspect Matrix */}
      {comparisonData && !loading && (
        <div className="space-y-8">
          {/* Top Product Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonData.products.map((item, idx) => {
              const p = item.product;
              const a = item.analytics;
              const hs = a.health_score || { score: 75, status: 'Healthy' };

              return (
                <div key={p.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}
                      alt={p.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-700 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                          {p.source}
                        </span>
                        <span className="text-xs font-bold text-amber-400 flex items-center">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {a.average_rating}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>
                  </div>

                  {/* Health Score Pill */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Health Score:</span>
                    <span className="font-mono font-bold text-brand-400">
                      {hs.score}/100 ({hs.status})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transparent Metric Comparison Table */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Metric-by-Metric Direct Comparison</h3>
              <span className="text-[11px] text-slate-500 italic">Neutral trend evaluation relative to peer average</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Evaluation Metric</th>
                    {comparisonData.products.map((item, i) => (
                      <th key={i} className="py-3 px-4 font-semibold text-white">
                        {item.product.name.slice(0, 24)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {comparisonData.comparison_matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-sans font-medium">
                        {row.metric_label}
                      </td>
                      {row.cells.map((cell, cIdx) => (
                        <td key={cIdx} className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                              {cell.value} {row.unit}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${getBadgeClass(cell.badge_style)}`}>
                              {cell.trend_label}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Aspect Comparison Matrix */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Aspect Sentiment Comparison Matrix</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Product Aspect</th>
                    {comparisonData.products.map((item, i) => (
                      <th key={i} className="py-3 px-4 font-semibold text-white">
                        {item.product.name.slice(0, 24)}...
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {comparisonData.aspect_comparison.map((aspRow, aIdx) => (
                    <tr key={aIdx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-200 font-sans font-medium">
                        {aspRow.aspect}
                      </td>
                      {aspRow.products.map((pCell, pIdx) => (
                        <td key={pIdx} className="py-3 px-4">
                          {pCell.mention_count > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400 font-bold">{pCell.pos_percent}% Pos</span>
                              <span className="text-slate-600">/</span>
                              <span className="text-rose-400 font-bold">{pCell.neg_percent}% Neg</span>
                              <span className="text-[10px] text-slate-500 font-sans">({pCell.mention_count} mentions)</span>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-sans">No mentions</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
