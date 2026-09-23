import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Search, Trash2, ArrowRight, Star, RefreshCw, AlertCircle, Plus } from 'lucide-react';
import { api } from '../services/api';

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listProducts(100);
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      setError("Failed to load products library.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this product analysis?")) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert("Failed to delete product.");
    }
  };

  const filtered = products.filter((p) =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.source || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Analyzed Products Library</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Browse and manage all previously analyzed product sentiment datasets
          </p>
        </div>

        <Link
          to="/search"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Analyze New Product</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="glass-card p-4 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved products by title or source..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading library items...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-4">
          <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No products found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? "No products match your search keyword." : "You haven't analyzed any products yet."}
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
          >
            Go to Analyzer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {prod.source}
                  </span>
                  {prod.is_demo && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-semibold">
                      Demo Data
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <img
                    src={prod.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}
                    alt={prod.name}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-700 shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="text-amber-400 font-bold flex items-center">
                        <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                        {prod.rating ? Number(prod.rating).toFixed(1) : '4.5'}
                      </span>
                      <span>•</span>
                      <span>{prod.review_count || 0} reviews</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => handleDelete(prod.id, e)}
                  title="Delete record"
                  className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <Link
                  to={`/dashboard/${prod.id}`}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-brand-600 text-slate-200 hover:text-white border border-slate-800 hover:border-brand-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>View Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
