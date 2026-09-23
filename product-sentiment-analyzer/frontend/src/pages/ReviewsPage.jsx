import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, RefreshCw, AlertCircle, Package } from 'lucide-react';
import { api } from '../services/api';
import ReviewExplorer from '../components/ReviewExplorer';

export default function ReviewsPage({ activeProductId }) {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialAspect = searchParams.get('aspect') || 'ALL';

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeProductId) return;
    setLoading(true);
    setError('');

    Promise.all([
      api.getProduct(activeProductId),
      api.getReviews(activeProductId, { limit: 200 })
    ])
      .then(([prodRes, revRes]) => {
        if (prodRes.success) setProduct(prodRes.product);
        if (revRes.success) setReviews(revRes.reviews || []);
      })
      .catch((err) => setError("Failed to load reviews for active product."))
      .finally(() => setLoading(false));
  }, [activeProductId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading Product Reviews...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Reviews Unavailable</h3>
        <p className="text-xs text-slate-400">{error || "Please select an analyzed product first."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-400">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Universal Review Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Verified Customer Reviews & Feedback
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Exploring <strong className="text-slate-200">{reviews.length} verified reviews</strong> for <strong className="text-slate-200">{product.name}</strong>
          </p>
        </div>
      </div>

      {/* Review Explorer Table & Filters */}
      <ReviewExplorer
        reviews={reviews}
        initialSearch={initialSearch}
        initialAspect={initialAspect}
      />
    </div>
  );
}
