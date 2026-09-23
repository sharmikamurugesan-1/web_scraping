import React, { useState } from 'react';
import { Sparkles, Send, RefreshCw, HelpCircle, Check, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import SentimentBadge from './SentimentBadge';
import SentimentBar from './SentimentBar';

const SAMPLE_TEXTS = [
  "The battery life is phenomenal and the camera takes crystal clear photos!",
  "Terrible build quality. The screen cracked on day two and customer service was completely unresponsive.",
  "It is an average device for the price. Not great, but not bad either.",
  "Never buying this again. Overheats constantly and charging is painfully slow.",
  "Super fast shipping, flawless packaging, and the product performs like a dream! Highly recommended!"
];

export default function SentimentPlayground() {
  const [inputText, setInputText] = useState(SAMPLE_TEXTS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (textToTest = inputText) => {
    if (!textToTest.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.testSentiment(textToTest);
      if (data.success) {
        setResult(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to backend NLP service');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleAnalyze(SAMPLE_TEXTS[0]);
  }, []);

  return (
    <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Live NLP Sentiment Tester</h3>
            <p className="text-xs text-slate-400">
              Test any custom consumer sentence in real-time with the VADER NLP classification engine
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
          Interactive Viva Playground
        </span>
      </div>

      {/* Preset Quick Chips */}
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-medium">Try quick benchmark examples:</span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(sample);
                handleAnalyze(sample);
              }}
              className="text-xs px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all text-left truncate max-w-xs"
            >
              &quot;{sample.slice(0, 42)}...&quot;
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste any product feedback to analyze sentiment..."
            className="w-full p-4 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Supports punctuation intensity (!), capitalization (WOW), emojis (😍/😡), and negations (not bad).
          </span>

          <button
            onClick={() => handleAnalyze(inputText)}
            disabled={loading || !inputText.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-600/30 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Computing...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Analyze Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Card */}
      {result && (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Classified Sentiment:</span>
              <SentimentBadge sentiment={result.sentiment} score={result.sentiment_score} size="lg" />
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Compound Polarity: </span>
              <span className="font-mono text-sm font-bold text-white">
                {result.sentiment_score > 0 ? `+${result.sentiment_score}` : result.sentiment_score}
              </span>
            </div>
          </div>

          {/* Continuous meter */}
          <div className="space-y-1">
            <SentimentBar score={result.sentiment_score} showLabels={true} />
          </div>

          {/* Polarity breakdown 3-way */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] text-slate-400 block">Positive Weight</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{result.pos_score}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] text-slate-400 block">Neutral Weight</span>
              <span className="text-sm font-bold font-mono text-amber-400">{result.neu_score}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <span className="text-[11px] text-slate-400 block">Negative Weight</span>
              <span className="text-sm font-bold font-mono text-rose-400">{result.neg_score}</span>
            </div>
          </div>

          {/* Keywords extracted */}
          {result.keywords && result.keywords.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <span>Extracted Keywords:</span>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
