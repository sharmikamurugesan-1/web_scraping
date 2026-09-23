import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Download,
  GitCompare,
  ArrowLeft,
  Star,
  Sparkles,
  BarChart3,
  MessageSquare,
  Zap,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Info,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Calendar,
  Activity,
  ShieldCheck,
  TrendingUp,
  FileText,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import SentimentBadge from '../components/SentimentBadge';
import SentimentBar from '../components/SentimentBar';
import ReviewExplorer from '../components/ReviewExplorer';
import SentimentDonutChart from '../components/charts/SentimentDonutChart';
import SentimentTrendChart from '../components/charts/SentimentTrendChart';
import RatingDistributionChart from '../components/charts/RatingDistributionChart';
import AspectSentimentChart from '../components/charts/AspectSentimentChart';
import WordCloud from '../components/charts/WordCloud';
import SentimentPlayground from '../components/SentimentPlayground';
import HealthScoreCard from '../components/HealthScoreCard';
import ReviewVolumeChart from '../components/charts/ReviewVolumeChart';
import AlertsPanel from '../components/AlertsPanel';
import DataQualityPanel from '../components/DataQualityPanel';

export default function DashboardPage({ activeProductId, onSelectProduct }) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  // Prefer route param, fallback to activeProductId
  const productId = routeId || activeProductId;

  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWord, setSelectedWord] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) {
      // If neither routeId nor activeProductId exists, fetch presets or redirect to library
      api.listProducts(1)
        .then((res) => {
          if (res.products && res.products.length > 0) {
            navigate(`/dashboard/${res.products[0].id}`, { replace: true });
          } else {
            setError('No products analyzed yet. Please run an analysis first.');
            setLoading(false);
          }
        })
        .catch(() => {
          setError('Failed to locate product.');
          setLoading(false);
        });
      return;
    }

    setLoading(true);
    setError('');

    Promise.all([
      api.getProduct(productId),
      api.getReviews(productId, { limit: 200 })
    ])
      .then(([prodRes, revRes]) => {
        if (prodRes.success) {
          setProductData(prodRes);
          if (onSelectProduct && prodRes.product?.id) {
            onSelectProduct(prodRes.product.id);
          }
        } else {
          setError(prodRes.error || 'Failed to load product analytics.');
        }

        if (revRes.success) {
          setReviews(revRes.reviews || []);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Error retrieving product intelligence.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  // Filter reviews by time window for presentation
  const filteredReviews = useMemo(() => {
    if (timeFilter === 'ALL' || !reviews.length) return reviews;
    const now = new Date();
    const daysMap = { '7D': 7, '30D': 30, '90D': 90, 'TODAY': 1 };
    const maxDays = daysMap[timeFilter] || 365;
    const cutoff = new Date(now.getTime() - maxDays * 24 * 60 * 60 * 1000);

    const filtered = reviews.filter((r) => {
      if (!r.review_date) return true;
      const d = new Date(r.review_date);
      return isNaN(d.getTime()) ? true : d >= cutoff;
    });
    return filtered.length > 0 ? filtered : reviews;
  }, [reviews, timeFilter]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading Intelligence Command Center...</p>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Dashboard Error</h2>
        <p className="text-sm text-slate-400">{error || 'Product not found.'}</p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Analyzer
        </Link>
      </div>
    );
  }

  const { product, analytics } = productData;
  const isDemo = Boolean(product.is_demo);

  const handleSelectWordFromCloud = (word) => {
    setSelectedWord(word);
    setActiveTab('reviews');
  };

  const timeFilterOptions = [
    { id: 'ALL', label: 'All Time' },
    { id: '90D', label: '90 Days' },
    { id: '30D', label: '30 Days' },
    { id: '7D', label: '7 Days' },
    { id: 'TODAY', label: 'Today' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner for Demo Mode if active */}
      {isDemo && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4 text-xs text-indigo-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold font-mono text-[10px] tracking-wider uppercase">
              DEMO MODE
            </span>
            <span>
              This intelligence dossier is powered by a verified benchmark e-commerce review corpus.
            </span>
          </div>
          <Link
            to="/analyze"
            className="text-white hover:text-indigo-200 font-semibold underline underline-offset-2 shrink-0"
          >
            Analyze Live URL
          </Link>
        </div>
      )}

      {/* Product Header Command Card */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Thumbnail & Title */}
          <div className="flex items-start gap-4">
            <img
              src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"}
              alt={product.name}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-700/80 shadow-md shrink-0 bg-slate-900"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {product.source || 'E-Commerce'}
                </span>
                {isDemo && (
                  <span className="text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold">
                    DEMO DATA
                  </span>
                )}
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">
                  {analytics.total_reviews} reviews evaluated
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-bold text-white leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 pt-1 text-xs">
                <div className="flex items-center text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 mr-1" />
                  <span>{product.rating ? Number(product.rating).toFixed(1) : '4.5'}</span>
                  <span className="text-slate-500 font-normal ml-1">/ 5.0</span>
                </div>

                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <span>Store Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons & Time Range Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Time Filter Pills */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
              {timeFilterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTimeFilter(opt.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    timeFilter === opt.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <a
                href={api.getExportCsvUrl(product.id)}
                download
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 text-brand-400" />
                <span className="hidden sm:inline">CSV</span>
              </a>

              <Link
                to={`/compare?id1=${product.id}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
                title="Compare against other products"
              >
                <GitCompare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Compare</span>
              </Link>

              <Link
                to="/insights"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all"
                title="View Mined Insights"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Insights</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Key Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Reviews */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Reviews</span>
          <p className="text-2xl font-black text-white">{analytics.total_reviews}</p>
          <span className="text-[10px] text-slate-500 block">Verified Corpus</span>
        </div>

        {/* Positive % */}
        <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-1">
          <span className="text-[11px] text-emerald-400 uppercase font-semibold">Positive %</span>
          <p className="text-2xl font-black text-emerald-400">{analytics.sentiment_percentages?.positive}%</p>
          <span className="text-[10px] text-emerald-500/80 block">{analytics.sentiment_counts?.positive} reviews</span>
        </div>

        {/* Neutral % */}
        <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-1">
          <span className="text-[11px] text-amber-400 uppercase font-semibold">Neutral %</span>
          <p className="text-2xl font-black text-amber-400">{analytics.sentiment_percentages?.neutral}%</p>
          <span className="text-[10px] text-amber-500/80 block">{analytics.sentiment_counts?.neutral} reviews</span>
        </div>

        {/* Negative % */}
        <div className="glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-1">
          <span className="text-[11px] text-rose-400 uppercase font-semibold">Negative %</span>
          <p className="text-2xl font-black text-rose-400">{analytics.sentiment_percentages?.negative}%</p>
          <span className="text-[10px] text-rose-500/80 block">{analytics.sentiment_counts?.negative} reviews</span>
        </div>

        {/* Avg Rating */}
        <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Avg Star Rating</span>
          <p className="text-2xl font-black text-amber-400">{analytics.average_rating}</p>
          <span className="text-[10px] text-slate-500 block">Out of 5.0 Stars</span>
        </div>

        {/* Net Polarity Index */}
        <div className="glass-card p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/10 space-y-1">
          <span className="text-[11px] text-brand-300 uppercase font-semibold">Net Polarity</span>
          <p className="text-2xl font-black font-mono text-brand-300">
            {analytics.average_sentiment_score > 0 ? `+${analytics.average_sentiment_score}` : analytics.average_sentiment_score}
          </p>
          <SentimentBar score={analytics.average_sentiment_score} />
        </div>
      </div>

      {/* Product Health Score Card (P0 Requirement) */}
      {analytics.health_score && (
        <HealthScoreCard healthData={analytics.health_score} />
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
          { id: 'reviews', label: `Reviews Explorer (${filteredReviews.length})`, icon: MessageSquare },
          { id: 'aspects', label: '9-Dimension Aspects', icon: Layers },
          { id: 'keywords', label: 'Word Cloud & Drivers', icon: Tag },
          { id: 'quality', label: 'Quality & Ingestion Audit', icon: ShieldCheck },
          { id: 'playground', label: 'Interactive NLP Tester', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Executive Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Charts Row 1: Donut & Rating Distribution & Trajectory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sentiment Donut */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Sentiment Distribution</h3>
                <span className="text-[11px] text-slate-400 font-mono">VADER NLP</span>
              </div>
              <SentimentDonutChart
                data={analytics.sentiment_counts}
                percentages={analytics.sentiment_percentages}
              />
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-xs">
                <div className="text-emerald-400 font-semibold">{analytics.sentiment_percentages?.positive}% Pos</div>
                <div className="text-amber-400 font-semibold">{analytics.sentiment_percentages?.neutral}% Neu</div>
                <div className="text-rose-400 font-semibold">{analytics.sentiment_percentages?.negative}% Neg</div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Star Rating Breakdown</h3>
                <span className="text-[11px] text-slate-400 font-mono">1★ to 5★</span>
              </div>
              <RatingDistributionChart distribution={analytics.rating_distribution} />
            </div>

            {/* Sentiment Trend Over Time */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Sentiment Trajectory</h3>
                <span className="text-[11px] text-slate-400 font-mono">Net Polarity</span>
              </div>
              <SentimentTrendChart trendData={analytics.sentiment_trend} />
            </div>
          </div>

          {/* Charts Row 2: Review Volume Velocity Chart & Automated Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Review Velocity Volume Chart */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Review Volume Velocity</h3>
                  <p className="text-[11px] text-slate-400">Review ingestion pace over temporal bins</p>
                </div>
                <span className="text-[11px] text-brand-400 font-mono">Frequency</span>
              </div>
              <ReviewVolumeChart trendData={analytics.sentiment_trend} />
            </div>

            {/* Alerts Panel */}
            <div>
              <AlertsPanel alerts={analytics.alerts || []} />
            </div>
          </div>

          {/* Top Positive vs Top Negative Customer Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Positive Highlight */}
            <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Most Positive Review Highlight</span>
                </div>
                {analytics.top_positive_reviews?.[0] && (
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    Score: +{analytics.top_positive_reviews[0].sentiment_score}
                  </span>
                )}
              </div>
              {analytics.top_positive_reviews?.[0] ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    &quot;{analytics.top_positive_reviews[0].review_text}&quot;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>— {analytics.top_positive_reviews[0].reviewer}</span>
                    <span>{analytics.top_positive_reviews[0].review_date}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No positive reviews in this sample.</p>
              )}
            </div>

            {/* Top Negative Highlight */}
            <div className="glass-card p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <ThumbsDown className="w-4 h-4" />
                  <span>Most Critical Pain Point Highlight</span>
                </div>
                {analytics.top_negative_reviews?.[0] && (
                  <span className="font-mono text-xs text-rose-400 font-bold">
                    Score: {analytics.top_negative_reviews[0].sentiment_score}
                  </span>
                )}
              </div>
              {analytics.top_negative_reviews?.[0] ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    &quot;{analytics.top_negative_reviews[0].review_text}&quot;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>— {analytics.top_negative_reviews[0].reviewer}</span>
                    <span>{analytics.top_negative_reviews[0].review_date}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No critical reviews in this sample.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reviews Explorer with aspect chips & modal trigger */}
      {activeTab === 'reviews' && (
        <ReviewExplorer reviews={filteredReviews} initialSearch={selectedWord} />
      )}

      {/* Tab 3: 9-Dimension Aspect Sentiment Breakdown */}
      {activeTab === 'aspects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">9-Dimension Aspect Sentiment Analysis</h3>
              <p className="text-xs text-slate-400">
                Automated NLP feature mining across battery, performance, camera, display, price, durability, design, delivery, and support
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              9 Target Dimensions
            </span>
          </div>

          <AspectSentimentChart aspects={analytics.aspect_analysis} />
        </div>
      )}

      {/* Tab 4: Word Cloud & Drivers */}
      {activeTab === 'keywords' && (
        <WordCloud
          wordFrequencies={analytics.word_frequencies}
          posWords={analytics.top_positive_words}
          negWords={analytics.top_negative_words}
          onSelectWord={handleSelectWordFromCloud}
        />
      )}

      {/* Tab 5: Data Quality & Ingestion Audit */}
      {activeTab === 'quality' && (
        <DataQualityPanel qualityData={analytics.data_quality} />
      )}

      {/* Tab 6: Interactive Live NLP Playground */}
      {activeTab === 'playground' && (
        <SentimentPlayground />
      )}
    </div>
  );
}
