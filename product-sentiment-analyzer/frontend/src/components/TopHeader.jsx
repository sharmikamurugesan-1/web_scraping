import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Search, Package, Plus, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';

export default function TopHeader({
  setMobileOpen,
  products = [],
  selectedProductId,
  onSelectProduct,
  activeProduct,
  collapsed
}) {
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/reviews?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  const isDemo = Boolean(activeProduct?.is_demo);

  return (
    <header className="sticky top-0 z-20 h-16 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu & Product Switcher */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Active Product Switcher */}
          {products.length > 0 && (
            <div className="relative flex-1 max-w-xs sm:max-w-sm">
              <select
                value={selectedProductId || ''}
                onChange={(e) => onSelectProduct && onSelectProduct(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white truncate focus:outline-none focus:border-brand-500 font-medium cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.source}] {p.name}
                  </option>
                ))}
              </select>
              <Package className="w-3.5 h-3.5 text-brand-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Global Search */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:block flex-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search reviews or keywords (Enter to search)..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
          </form>
        </div>

        {/* Right Section: Badges & CTA */}
        <div className="flex items-center gap-3">
          {/* DEMO MODE Pill */}
          {isDemo && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>DEMO MODE</span>
            </div>
          )}

          {/* Quick CTA */}
          <Link
            to="/analyze"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm shadow-brand-600/20 transition-all hover:scale-[1.02] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analyze Product</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
