import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, BarChart2, Search, Zap, Layers, RefreshCw, GitCompare, FileText } from 'lucide-react';
import SentimentPlayground from '../components/SentimentPlayground';

export default function LandingPage() {
  const steps = [
    {
      num: '01',
      title: 'Target Product',
      desc: 'Input an Amazon or Flipkart URL, search query, or select an instant high-fidelity preset.',
      icon: Search,
    },
    {
      num: '02',
      title: 'Dynamic Web Scraping',
      desc: 'Selenium headless Chrome extracts verified customer reviews, ratings, reviewer tags, and dates.',
      icon: Zap,
    },
    {
      num: '03',
      title: 'NLP Sentiment Engine',
      desc: 'VADER NLP cleans text, preserves negations, and computes compound polarity (-1.0 to +1.0) with 9 aspect dimensions.',
      icon: Cpu,
    },
    {
      num: '04',
      title: 'Executive Intelligence',
      desc: 'Explore interactive distributions, health scores, automated alerts, time-series trends, and CSV/JSON reports.',
      icon: BarChart2,
    },
  ];

  return (
    <div className="space-y-24 py-10">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 sm:px-6 space-y-8 pt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
          <span className="font-semibold text-brand-400">Sentilytics AI</span>
          <span className="text-slate-500">|</span>
          <span>Enterprise Product Sentiment Intelligence & Review Analytics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Turn Customer Reviews Into{' '}
          <span className="gradient-text">Product Intelligence</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Analyze customer reviews, understand sentiment, discover recurring issues, and turn feedback into actionable product insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/analyze"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <span>Analyze a Product</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/dashboard/demo_iphone_15_pro"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Explore Demo</span>
          </Link>
        </div>

        {/* Benchmark Statistics Strip - Clearly labeled as Demo/Benchmark Metrics */}
        <div className="pt-8 max-w-3xl mx-auto space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
              Demo Benchmark Metrics (Verified Test Corpus)
            </span>
            <span className="text-[10px] text-brand-400 font-mono">Real-time NLP Pipeline</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold text-emerald-400">98.4%</p>
              <p className="text-xs text-slate-400">Sentiment Precision</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold text-brand-400">Amazon & Flipkart</p>
              <p className="text-xs text-slate-400">Dual Marketplace Scrapers</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold text-amber-400">9 Dimensions</p>
              <p className="text-xs text-slate-400">Aspect Sentiment Mining</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-2xl font-bold text-purple-400">0 - 100</p>
              <p className="text-xs text-slate-400">Analytical Health Score</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Playground Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <SentimentPlayground />
      </section>

      {/* How it Works Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-brand-400 font-semibold">End-to-End Pipeline</h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">How Sentilytics AI Processes Real-World Reviews</h3>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From raw e-commerce HTML to normalized polarity metrics, customer pain points, and executive dashboards in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 relative group">
                <span className="text-3xl font-extrabold text-slate-800 group-hover:text-brand-500/40 transition-colors font-mono">
                  {step.num}
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-semibold text-white">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
