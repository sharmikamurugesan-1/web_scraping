import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, BarChart3, Search, GitCompare, Code2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar() {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    api.getHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Sparkles },
    { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { to: '/analyze', label: 'Analyze', icon: Search },
    { to: '/products', label: 'Library', icon: BarChart3 },
    { to: '/compare', label: 'Compare', icon: GitCompare },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-dark-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Sentilytics <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-mono font-medium">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1 tracking-wider uppercase font-semibold">Product Intelligence</span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Backend Status & CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus === 'online'
                  ? 'bg-emerald-400 animate-pulse'
                  : backendStatus === 'offline'
                  ? 'bg-rose-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400 font-medium">
              API: <span className={backendStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}>
                {backendStatus === 'online' ? 'Active' : backendStatus === 'offline' ? 'Offline' : 'Connecting'}
              </span>
            </span>
          </div>

          <Link
            to="/search"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-600/25 transition-all hover:scale-[1.02]"
          >
            <Search className="w-4 h-4" />
            <span>Analyze Review</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
