import React, { useState, useEffect } from 'react';
import { FileText, Download, Printer, CheckCircle2, Star, Calendar, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage({ activeProductId }) {
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeProductId) return;
    setLoading(true);
    api.getProduct(activeProductId)
      .then((res) => {
        if (res.success) setProductData(res);
        else setError(res.error || "Failed to load product report data.");
      })
      .catch((err) => setError("Error loading reports."))
      .finally(() => setLoading(false));
  }, [activeProductId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400">Compiling Intelligence Report...</p>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Report Not Found</h3>
        <p className="text-xs text-slate-400">{error || "Please select an analyzed product first."}</p>
      </div>
    );
  }

  const { product, analytics } = productData;
  const nowStr = new Date().toLocaleString();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Controls Bar (hidden during print) */}
      <div className="print:hidden glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-400" />
            Product Intelligence Reports Hub
          </h1>
          <p className="text-xs text-slate-400">
            Export raw or structured evaluation summaries for executive review and compliance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={api.getExportCsvUrl(product.id)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </a>

          <a
            href={api.getExportJsonUrl(product.id)}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export JSON</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Executive Report Sheet */}
      <div className="bg-slate-950 border border-slate-800 p-8 sm:p-10 rounded-2xl space-y-8 print:p-0 print:border-none print:bg-white print:text-black">
        {/* Report Header */}
        <div className="border-b border-slate-800 print:border-gray-300 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-400 print:text-indigo-600 font-bold font-mono">
              Sentilytics AI • Intelligence Dossier
            </div>
            <h2 className="text-2xl font-black text-white print:text-black mt-1">
              {product.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 print:text-gray-600 mt-1">
              <span>Source: <strong>{product.source}</strong></span>
              <span>•</span>
              <span>Corpus: <strong>{analytics.total_reviews} Reviews</strong></span>
              <span>•</span>
              <span>Rating: <strong>{analytics.average_rating} / 5.0 ★</strong></span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 print:text-gray-500 font-mono">
            <div>Report ID: {product.id}</div>
            <div>Generated: {nowStr}</div>
          </div>
        </div>

        {/* Executive KPIs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Product Health Score</span>
            <p className="text-2xl font-black text-brand-400 print:text-indigo-600 font-mono mt-1">
              {analytics.health_score?.score || 85}/100
            </p>
            <span className="text-[10px] text-slate-500">{analytics.health_score?.status || 'Healthy'} Grade {analytics.health_score?.grade || 'A'}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Positive Approval</span>
            <p className="text-2xl font-black text-emerald-400 print:text-green-600 font-mono mt-1">
              {analytics.sentiment_percentages?.positive}%
            </p>
            <span className="text-[10px] text-slate-500">{analytics.sentiment_counts?.positive} Customers</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Negative Sentiment</span>
            <p className="text-2xl font-black text-rose-400 print:text-red-600 font-mono mt-1">
              {analytics.sentiment_percentages?.negative}%
            </p>
            <span className="text-[10px] text-slate-500">{analytics.sentiment_counts?.negative} Customers</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 print:bg-gray-100 border border-slate-800 print:border-gray-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 print:text-gray-600">Net Polarity</span>
            <p className="text-2xl font-black text-white print:text-black font-mono mt-1">
              {analytics.average_sentiment_score > 0 ? `+${analytics.average_sentiment_score}` : analytics.average_sentiment_score}
            </p>
            <span className="text-[10px] text-slate-500">Range: [-1.0, +1.0]</span>
          </div>
        </div>

        {/* AI Executive Summary Verdict */}
        {analytics.ai_summary && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Executive Evaluation Summary
            </h3>
            <p className="p-4 rounded-xl bg-slate-900/60 print:bg-gray-100 border border-slate-800 print:border-gray-200 text-xs sm:text-sm text-slate-200 print:text-gray-800 leading-relaxed italic">
              &quot;{analytics.ai_summary.executive_verdict}&quot;
            </p>
          </div>
        )}

        {/* Rating Breakdown & Sentiment Split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Rating Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Star Rating Distribution
            </h3>
            <div className="space-y-2">
              {analytics.rating_distribution?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-slate-400 print:text-gray-600 font-medium">{item.stars}</span>
                  <div className="flex-1 h-2 bg-slate-800 print:bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono text-slate-300 print:text-black">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Aspect Breakdown Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Targeted Aspect Matrix
            </h3>
            <div className="space-y-2 text-xs">
              {analytics.aspect_analysis?.slice(0, 6).map((asp, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 print:bg-gray-100 border border-slate-800 print:border-gray-200">
                  <span className="font-semibold text-slate-200 print:text-black">{asp.aspect}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-400 print:text-green-600">{asp.pos_percent}% Pos</span>
                    <span className="text-rose-400 print:text-red-600">{asp.neg_percent}% Neg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Pain Points & Strengths */}
        {analytics.customer_insights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800 print:border-gray-300">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 print:text-red-600">
                Primary Friction Areas
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 print:text-gray-800">
                {analytics.customer_insights.pain_points?.slice(0, 3).map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span><strong>{p.title}:</strong> {p.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-green-600">
                Primary Customer Accolades
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300 print:text-gray-800">
                {analytics.customer_insights.loved_features?.slice(0, 3).map((l, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>{l.title}:</strong> {l.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Footer Disclaimer */}
        <div className="pt-6 border-t border-slate-800 print:border-gray-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 print:text-gray-500">
          <span>Sentilytics AI Intelligence Report • Enterprise SaaS Edition</span>
          <span>Application-defined analytical score. Generated for academic & professional presentation.</span>
        </div>
      </div>
    </div>
  );
}
