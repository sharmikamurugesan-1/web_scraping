import React, { useState, useMemo } from 'react';
import { Search, Star, CheckCircle2, Filter, ArrowUpDown, Tag, Calendar, ChevronLeft, ChevronRight, Layers, Maximize2 } from 'lucide-react';
import SentimentBadge from './SentimentBadge';
import SentimentBar from './SentimentBar';
import ReviewDetailModal from './ReviewDetailModal';

const ASPECT_OPTIONS = [
  'ALL',
  'Battery & Power',
  'Performance & Speed',
  'Camera & Optics',
  'Display & Screen',
  'Price & Value',
  'Quality & Durability',
  'Design & Ergonomics',
  'Delivery & Packaging',
  'Customer Service & Support'
];

export default function ReviewExplorer({ reviews = [], initialSearch = '', initialAspect = 'ALL' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');
  const [aspectFilter, setAspectFilter] = useState(initialAspect);
  const [sortBy, setSortBy] = useState('sentiment-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedModalReview, setSelectedModalReview] = useState(null);

  // Sync props if changed externally
  React.useEffect(() => {
    if (initialSearch) setSearchTerm(initialSearch);
  }, [initialSearch]);

  React.useEffect(() => {
    if (initialAspect) setAspectFilter(initialAspect);
  }, [initialAspect]);

  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Sentiment filter
        if (sentimentFilter !== 'ALL' && r.sentiment?.toUpperCase() !== sentimentFilter) {
          return false;
        }
        // Rating filter
        if (ratingFilter !== 'ALL' && Math.floor(Number(r.rating || 0)) !== Number(ratingFilter)) {
          return false;
        }
        // Aspect filter
        if (aspectFilter !== 'ALL') {
          const revAspects = r.aspects || [];
          if (!revAspects.includes(aspectFilter)) {
            // Also check text as fallback
            const matchAspect = (r.review_text || '').toLowerCase().includes(aspectFilter.toLowerCase().split(' ')[0]);
            if (!matchAspect) return false;
          }
        }
        // Text search
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchText = (r.review_text || '').toLowerCase().includes(term);
          const matchReviewer = (r.reviewer || '').toLowerCase().includes(term);
          if (!matchText && !matchReviewer) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'sentiment-desc') return (b.sentiment_score || 0) - (a.sentiment_score || 0);
        if (sortBy === 'sentiment-asc') return (a.sentiment_score || 0) - (b.sentiment_score || 0);
        if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'rating-asc') return (a.rating || 0) - (b.rating || 0);
        if (sortBy === 'date-desc') return (b.review_date || '').localeCompare(a.review_date || '');
        return 0;
      });
  }, [reviews, searchTerm, sentimentFilter, ratingFilter, aspectFilter, sortBy]);

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sentimentFilter, ratingFilter, aspectFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReviews.slice(startIndex, startIndex + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in reviews by keyword, topic, or reviewer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Aspect Filter Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Layers className="w-4 h-4 text-slate-400 hidden md:block" />
            <select
              value={aspectFilter}
              onChange={(e) => setAspectFilter(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Product Aspects</option>
              {ASPECT_OPTIONS.slice(1).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown className="w-4 h-4 text-slate-400 hidden md:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full md:w-auto px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="sentiment-desc">Highest Polarity First</option>
              <option value="sentiment-asc">Lowest Polarity First</option>
              <option value="rating-desc">Highest Star Rating</option>
              <option value="rating-asc">Lowest Star Rating</option>
              <option value="date-desc">Newest Reviews First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          {/* Sentiment Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sentiment:
            </span>
            {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((val) => (
              <button
                key={val}
                onClick={() => setSentimentFilter(val)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  sentimentFilter === val
                    ? val === 'POSITIVE'
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : val === 'NEGATIVE'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                      : val === 'NEUTRAL'
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                      : 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {val === 'ALL' ? 'All Reviews' : val.charAt(0) + val.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Stars:</span>
            {['ALL', '5', '4', '3', '2', '1'].map((stars) => (
              <button
                key={stars}
                onClick={() => setRatingFilter(stars)}
                className={`px-2.5 py-0.5 rounded text-xs font-medium transition-all cursor-pointer ${
                  ratingFilter === stars
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {stars === 'ALL' ? 'All' : `${stars}★`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Review Count & Page Size Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 gap-2">
        <span>
          Showing <strong className="text-slate-200">{filteredReviews.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
          <strong className="text-slate-200">{Math.min(filteredReviews.length, currentPage * pageSize)}</strong> of{' '}
          <strong className="text-slate-200">{filteredReviews.length}</strong> filtered reviews
        </span>

        <div className="flex items-center gap-2">
          <span>Per page:</span>
          {[10, 20, 50].map((sz) => (
            <button
              key={sz}
              onClick={() => setPageSize(sz)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                pageSize === sz ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {paginatedReviews.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-xl border border-slate-800 space-y-3">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">No matching reviews found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, clearing the aspect filter, or resetting sentiment/star pills.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSentimentFilter('ALL');
                setRatingFilter('ALL');
                setAspectFilter('ALL');
              }}
              className="px-3.5 py-1.5 bg-brand-600/30 text-brand-300 rounded-lg text-xs font-medium hover:bg-brand-600/50 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          paginatedReviews.map((rev, index) => {
            return (
              <div
                key={rev.id || index}
                onClick={() => setSelectedModalReview(rev)}
                className="glass-card p-4 rounded-xl border border-slate-800/90 space-y-3 hover:border-slate-700/80 transition-all cursor-pointer group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {/* Star Rating Display */}
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(Number(rev.rating || 5))
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                      <span className="ml-1.5 text-xs font-semibold text-slate-300">
                        {Number(rev.rating || 5).toFixed(1)}
                      </span>
                    </div>

                    <span className="text-slate-600">•</span>

                    {/* Reviewer Name */}
                    <span className="text-xs font-medium text-slate-300">
                      {rev.reviewer || 'Amazon/Flipkart Customer'}
                    </span>

                    {/* Verified Badge */}
                    {rev.verified_purchase && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Sentiment Badge & Date */}
                  <div className="flex items-center gap-2">
                    {rev.review_date && (
                      <span className="text-[11px] text-slate-500">{rev.review_date}</span>
                    )}
                    <SentimentBadge sentiment={rev.sentiment} score={rev.sentiment_score} size="sm" />
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Review Text */}
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {rev.review_text}
                </p>

                {/* Detected Aspects */}
                {rev.aspects && rev.aspects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.aspects.map((asp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 text-[10px] font-medium border border-brand-500/20"
                      >
                        {asp}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Sentiment Meter */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="w-full sm:w-48">
                    <SentimentBar score={rev.sentiment_score} />
                  </div>

                  {/* Polarity Breakdown Pill */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400">Pos: {Number(rev.pos_score || 0).toFixed(2)}</span>
                    <span>•</span>
                    <span className="text-amber-400">Neu: {Number(rev.neu_score || 0).toFixed(2)}</span>
                    <span>•</span>
                    <span className="text-rose-400">Neg: {Number(rev.neg_score || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-slate-400">
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-medium transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Review Detail Modal Drawer */}
      <ReviewDetailModal
        review={selectedModalReview}
        onClose={() => setSelectedModalReview(null)}
      />
    </div>
  );
}
