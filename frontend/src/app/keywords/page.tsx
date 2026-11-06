'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound, Sparkles, Download, Filter, Search, ArrowRight, ShieldCheck,
  Copy, CheckCircle2, Globe, Compass, Flame, TrendingUp, CheckSquare,
  Square, PenTool, Share2, ListOrdered, Check, Key, Zap, ExternalLink,
  RefreshCw, Plus, CheckCheck, HelpCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Keyword, MultiPlatformKeywordResult, GoogleTrendsResponse, TrendingKeywordItem, TrendingTopicSuggestion } from '@/types';

export default function KeywordsPage() {
  const router = useRouter();
  const { activeBrand, activeCollection, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'standard' | 'multi_platform' | 'trends'>('trends');

  // Standard Keywords State
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [topicInput, setTopicInput] = useState('Enterprise AI Content Intelligence');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Multi-Platform Omni-Presence State (Skill 2)
  const [mpTopic, setMpTopic] = useState('AI Workflow Automation & Intelligent Agents');
  const [mpBusinessType, setMpBusinessType] = useState('B2B');
  const [mpResult, setMpResult] = useState<MultiPlatformKeywordResult | null>(null);
  const [mpLoading, setMpLoading] = useState(false);
  const [copiedSeeds, setCopiedSeeds] = useState(false);

  // Google Trends Real-Time Explorer State (SerpApi)
  const [trendsTopic, setTrendsTopic] = useState('Artificial Intelligence Agents');
  const [trendsGeo, setTrendsGeo] = useState('US');
  const [trendsDate, setTrendsDate] = useState('today 12-m');
  const [trendsCustomKey, setTrendsCustomKey] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsResult, setTrendsResult] = useState<GoogleTrendsResponse | null>(null);

  // Selection & Filtering in Trends Tab
  const [selectedTrendKeywords, setSelectedTrendKeywords] = useState<string[]>([]);
  const [trendKeywordsFilter, setTrendKeywordsFilter] = useState<'all' | 'rising' | 'top'>('all');
  const [trendSearchTerm, setTrendSearchTerm] = useState('');
  const [savingTrendKeywords, setSavingTrendKeywords] = useState(false);
  const [copiedTrends, setCopiedTrends] = useState(false);
  const [copiedTopicIdx, setCopiedTopicIdx] = useState<number | null>(null);

  const categories = [
    'all', 'primary', 'secondary', 'long-tail', 'semantic', 'related',
    'question', 'commercial', 'informational', 'transactional', 'navigational'
  ];

  const fetchKeywords = async () => {
    try {
      const data = await apiClient.getKeywords(activeBrand?.id);
      setKeywords(data);
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, [activeBrand]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput) return;
    setLoading(true);
    try {
      const generated = await apiClient.generateKeywords({
        topic: topicInput,
        industry: activeBrand?.industry,
        target_audience: activeBrand?.target_audience,
        brand_id: activeBrand?.id,
        collection_id: activeCollection?.id
      });
      showToast(`Generated ${generated.length} strategic keywords`, 'success');
      setKeywords(generated);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Keyword generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMultiPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpTopic) return;
    setMpLoading(true);
    try {
      const res = await apiClient.generateMultiPlatformKeywords({
        topic: mpTopic,
        industry: activeBrand?.industry,
        target_audience: activeBrand?.target_audience,
        business_type: mpBusinessType,
        brand_id: activeBrand?.id
      });
      setMpResult(res);
      showToast(`Generated ${res.seed_keywords.length} Seed Keywords across 8 Platforms`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Multi-platform research failed', 'error');
    } finally {
      setMpLoading(false);
    }
  };

  const handleCopySeeds = () => {
    if (!mpResult) return;
    navigator.clipboard.writeText(mpResult.seed_keywords.join('\n'));
    setCopiedSeeds(true);
    showToast('Copied seed keywords to clipboard (ready for Google Keyword Planner)', 'success');
    setTimeout(() => setCopiedSeeds(false), 3000);
  };

  // Google Trends Execution
  const handleSearchTrends = async (topicToSearch?: string) => {
    const q = (topicToSearch || trendsTopic).trim();
    if (!q) {
      showToast('Please enter a topic to search Google Trends', 'error');
      return;
    }
    setTrendsLoading(true);
    try {
      const res = await apiClient.searchGoogleTrends({
        topic: q,
        geo: trendsGeo,
        date: trendsDate,
        serpapi_key: trendsCustomKey.trim() || undefined,
        brand_id: activeBrand?.id
      });
      setTrendsResult(res);
      // Auto-select initial 3-4 rising queries so user immediately has useful selected keywords
      const initialPicks = res.rising_keywords.slice(0, 4).map((k) => k.keyword);
      setSelectedTrendKeywords(initialPicks);

      const srcLabel = res.source === 'serpapi_google_trends' ? 'SerpApi Google Trends' : 'Real-Time Trends Intelligence';
      showToast(`Discovered ${res.total_found} trending keywords via ${srcLabel}`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Google Trends search failed', 'error');
    } finally {
      setTrendsLoading(false);
    }
  };

  const toggleSelectTrendKeyword = (kw: string) => {
    if (selectedTrendKeywords.includes(kw)) {
      setSelectedTrendKeywords(selectedTrendKeywords.filter((k) => k !== kw));
    } else {
      setSelectedTrendKeywords([...selectedTrendKeywords, kw]);
    }
  };

  const handleSelectAllVisible = (visibleKws: TrendingKeywordItem[]) => {
    const visibleNames = visibleKws.map((k) => k.keyword);
    const combined = Array.from(new Set([...selectedTrendKeywords, ...visibleNames]));
    setSelectedTrendKeywords(combined);
    showToast(`Selected all ${visibleNames.length} visible keywords`, 'info');
  };

  const handleSelectRisingOnly = () => {
    if (!trendsResult) return;
    const risingNames = trendsResult.rising_keywords.map((k) => k.keyword);
    setSelectedTrendKeywords(risingNames);
    showToast(`Selected all ${risingNames.length} breakout & rising queries`, 'info');
  };

  const handleClearSelection = () => {
    setSelectedTrendKeywords([]);
    showToast('Cleared keyword selection', 'info');
  };

  const handleCopySelectedTrends = () => {
    if (selectedTrendKeywords.length === 0) return;
    navigator.clipboard.writeText(selectedTrendKeywords.join(', '));
    setCopiedTrends(true);
    showToast(`Copied ${selectedTrendKeywords.length} keywords to clipboard`, 'success');
    setTimeout(() => setCopiedTrends(false), 2500);
  };

  const handleSaveSelectedKeywords = async () => {
    if (selectedTrendKeywords.length === 0) return;
    setSavingTrendKeywords(true);
    try {
      const saved = await apiClient.saveTrendingKeywords({
        keywords: selectedTrendKeywords,
        brand_id: activeBrand?.id,
        collection_id: activeCollection?.id,
        category: 'trending',
        search_intent: 'informational'
      });
      showToast(`Saved ${saved.length} trending keywords to your Library!`, 'success');
      await fetchKeywords();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save keywords', 'error');
    } finally {
      setSavingTrendKeywords(false);
    }
  };

  const handleOpenWriterWithSelected = () => {
    if (selectedTrendKeywords.length === 0) {
      showToast('Select at least one keyword first', 'error');
      return;
    }
    const kwParam = encodeURIComponent(selectedTrendKeywords.join(', '));
    const topicParam = encodeURIComponent(trendsTopic);
    router.push(`/writer?topic_title=${topicParam}&compulsory_keywords=${kwParam}`);
  };

  const handleOpenPipelineWithSelected = () => {
    if (selectedTrendKeywords.length === 0) {
      showToast('Select at least one keyword first', 'error');
      return;
    }
    const kwParam = encodeURIComponent(selectedTrendKeywords.join(', '));
    const topicParam = encodeURIComponent(trendsTopic);
    router.push(`/pipeline?topic=${topicParam}&keywords=${kwParam}`);
  };

  const handleCopyTopic = (topic: TrendingTopicSuggestion, idx: number) => {
    const text = `${topic.title}\n\nAngle: ${topic.angle}\nTarget Audience: ${topic.target_audience}\nKeywords: ${topic.matched_keywords.join(', ')}\n\n${topic.description}`;
    navigator.clipboard.writeText(text);
    setCopiedTopicIdx(idx);
    showToast('Copied topic brief to clipboard', 'success');
    setTimeout(() => setCopiedTopicIdx(null), 2500);
  };

  const filteredKeywords = keywords.filter((k) => {
    const matchesCat = selectedCategory === 'all' || k.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = k.keyword.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          (k.related_topic && k.related_topic.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleExportCSV = () => {
    if (keywords.length === 0) return;
    const header = 'Keyword,Category,Search Intent,Relevance Score,Related Topic,Suggested Content Type,Search Volume,Difficulty\n';
    const rows = filteredKeywords.map((k) => 
      `"${k.keyword}","${k.category}","${k.search_intent}",${k.relevance_score},"${k.related_topic || ''}","${k.suggested_content_type || ''}","${k.search_volume}","${k.difficulty}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords_${topicInput.replace(/\s+/g, '_')}.csv`;
    a.click();
    showToast('Exported keyword CSV', 'success');
  };

  // Visible Trend Keywords filtering
  const allTrendKeywords: TrendingKeywordItem[] = trendsResult ? [
    ...trendsResult.rising_keywords,
    ...trendsResult.top_keywords
  ] : [];

  const visibleTrendKeywords = allTrendKeywords.filter((k) => {
    if (trendKeywordsFilter === 'rising' && k.type !== 'rising') return false;
    if (trendKeywordsFilter === 'top' && k.type !== 'top') return false;
    if (trendSearchTerm && !k.keyword.toLowerCase().includes(trendSearchTerm.toLowerCase())) return false;
    return true;
  });

  const TREND_INSPIRATION_TOPICS = [
    'Artificial Intelligence Agents',
    'Electric Vehicles',
    'Generative Search Optimization',
    'Remote Work Automation',
    'Cybersecurity Mesh Architecture',
    'Quantum Computing Applications',
    'B2B SaaS Growth'
  ];

  return (
    <div style={{ paddingBottom: selectedTrendKeywords.length > 0 && activeTab === 'trends' ? 90 : 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Keyword Intelligence & Trends Engine
            </h1>
            <span style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Flame size={13} />
              <span>SerpApi Google Trends Enabled</span>
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Discover real-time surging search trends via SerpApi Google Trends, select high-demand keywords, and turn them into ready-to-write content topics.
          </p>
        </div>
        {activeTab === 'standard' && (
          <button onClick={handleExportCSV} disabled={keywords.length === 0} className="btn-secondary">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('trends')}
          className={activeTab === 'trends' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Flame size={15} style={{ color: activeTab === 'trends' ? '#ffffff' : '#ef4444' }} />
          <span>Google Trends Real-Time Explorer</span>
          <span style={{ background: activeTab === 'trends' ? '#ffffff22' : '#fee2e2', color: activeTab === 'trends' ? '#ffffff' : '#dc2626', borderRadius: 9999, fontSize: '0.65rem', padding: '1px 6px', fontWeight: 800 }}>
            SERPAPI
          </span>
        </button>

        <button
          onClick={() => setActiveTab('standard')}
          className={activeTab === 'standard' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <KeyRound size={15} />
          <span>10-Category Search Engine Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('multi_platform')}
          className={activeTab === 'multi_platform' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Globe size={15} />
          <span>Omnipresence Multi-Platform (8 Channels)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: GOOGLE TRENDS REAL-TIME EXPLORER (SERPAPI)        */}
      {/* ======================================================== */}
      {activeTab === 'trends' && (
        <div>
          {/* Trends Search Form Card */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSearchTrends(); }} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 170px auto', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Target Topic or Industry Term
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: '#94a3b8' }} />
                  <input
                    style={{ width: '100%', fontSize: '0.95rem', padding: '10px 14px 10px 38px' }}
                    placeholder="e.g. Artificial Intelligence Agents, Cloud Migration, EV Batteries"
                    value={trendsTopic}
                    onChange={(e) => setTrendsTopic(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Region / Geo
                </label>
                <select
                  style={{ width: '100%', fontSize: '0.9rem', padding: '10px' }}
                  value={trendsGeo}
                  onChange={(e) => setTrendsGeo(e.target.value)}
                >
                  <option value="GLOBAL">🌍 Worldwide</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="IN">🇮🇳 India</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="FR">🇫🇷 France</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Time Range
                </label>
                <select
                  style={{ width: '100%', fontSize: '0.9rem', padding: '10px' }}
                  value={trendsDate}
                  onChange={(e) => setTrendsDate(e.target.value)}
                >
                  <option value="now 7-d">⚡ Past 7 Days (Fresh)</option>
                  <option value="today 1-m">📅 Past 30 Days</option>
                  <option value="today 3-m">📊 Past 90 Days</option>
                  <option value="today 12-m">📈 Past 12 Months (Default)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={trendsLoading}
                className="btn-primary"
                style={{ height: 42, padding: '0 24px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderColor: '#b91c1c' }}
              >
                <Flame size={16} />
                <span>{trendsLoading ? 'Mining Google Trends...' : 'Search Google Trends'}</span>
              </button>
            </form>

            {/* Quick Inspiration Pills & SerpApi Settings Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Try Trending:</span>
                {TREND_INSPIRATION_TOPICS.map((topicItem, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTrendsTopic(topicItem);
                      handleSearchTrends(topicItem);
                    }}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      color: '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    {topicItem}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowKeyConfig(!showKeyConfig)}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#64748b' }}
              >
                <Key size={13} />
                <span>{showKeyConfig ? 'Hide API Key Settings' : 'Custom SerpApi Key (Optional)'}</span>
              </button>
            </div>

            {/* Inline SerpApi Key Configuration Drawer */}
            {showKeyConfig && (
              <div style={{ marginTop: 14, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: '#0f172a' }}>🔑 Custom SerpApi API Key Override</strong>
                  <Link href="/models" style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'underline' }}>
                    Configure permanently in AI Model Settings
                  </Link>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="password"
                    placeholder="Enter custom SerpApi key (leave empty to use default .env / DB credential)"
                    value={trendsCustomKey}
                    onChange={(e) => setTrendsCustomKey(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.825rem' }}
                  />
                  {trendsCustomKey && (
                    <button
                      type="button"
                      onClick={() => { setTrendsCustomKey(''); showToast('Cleared custom key', 'info'); }}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0 12px' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                  If no SerpApi key is supplied, our real-time Google search trend intelligence engine automatically provides live trending queries and breakout topics.
                </p>
              </div>
            )}
          </div>

          {/* Results Display */}
          {trendsResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Trend Summary Banner */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', borderRadius: 12, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="badge" style={{ background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.75rem', padding: '3px 10px' }}>
                        🔥 Trending Search Report
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Region: <strong>{trendsResult.geo}</strong> • Range: <strong>{trendsResult.date_range}</strong>
                      </span>
                      <span className="badge" style={{ background: '#334155', color: '#38bdf8', fontSize: '0.7rem' }}>
                        {trendsResult.source === 'serpapi_google_trends' ? '⚡ SerpApi Google Trends Engine' : '🤖 Trends Intelligence Engine'}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                      {trendsResult.topic}
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: 6, maxWidth: 800 }}>
                      {trendsResult.summary}
                    </p>
                  </div>

                  {/* Stat Cards */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f87171' }}>
                        {trendsResult.rising_keywords.length}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Breakouts & Rising</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
                        {trendsResult.top_keywords.length}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Top Search Volume</div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 16px', textAlign: 'center', minWidth: 100 }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                        {trendsResult.suggested_topics.length}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#cbd5e1', textTransform: 'uppercase' }}>Ready Topics</div>
                    </div>
                  </div>
                </div>

                {/* Related Entities / Topics Chips */}
                {trendsResult.related_topics.length > 0 && (
                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Related Trending Entities:</span>
                    {trendsResult.related_topics.map((entity, i) => (
                      <span key={i} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '2px 10px', fontSize: '0.75rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span>{entity.title}</span>
                        {entity.growth && (
                          <span style={{ color: entity.is_rising ? '#4ade80' : '#38bdf8', fontWeight: 700, fontSize: '0.7rem' }}>
                            ({entity.growth})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* SUGGESTED TRENDING CONTENT TOPICS (PRE-PACKAGED FOR USER) */}
              {/* ======================================================== */}
              {trendsResult.suggested_topics.length > 0 && (
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>🎯 Suggested High-Impact Content Topics</span>
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          Ready to Write
                        </span>
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.825rem', marginTop: 2 }}>
                        Synthesized directly from current breakout queries. Click to immediately draft or create social posts.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
                    {trendsResult.suggested_topics.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          borderRadius: 10,
                          border: '1px solid #e2e8f0',
                          padding: 18,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          {/* Badges */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                              {item.content_format}
                            </span>
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                              Platform: {item.recommended_platform}
                            </span>
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              {item.angle}
                            </span>
                          </div>

                          {/* Headline */}
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: 8 }}>
                            {item.title}
                          </h4>

                          {/* Description */}
                          <p style={{ color: '#475569', fontSize: '0.825rem', lineHeight: 1.5, marginBottom: 10 }}>
                            {item.description}
                          </p>

                          {/* Why Trending Callout */}
                          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 6, padding: '8px 10px', fontSize: '0.75rem', color: '#065f46', marginBottom: 10 }}>
                            <strong>🔥 Trend Driver:</strong> {item.why_trending}
                          </div>

                          {/* Matched Keywords Chips */}
                          {item.matched_keywords?.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Keywords:</span>
                              {item.matched_keywords.map((kw, ki) => (
                                <span key={ki} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, padding: '2px 6px', fontSize: '0.7rem', color: '#1e293b' }}>
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 1-Click Action Buttons */}
                        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                          <Link
                            href={`/writer?topic_title=${encodeURIComponent(item.title)}&compulsory_keywords=${encodeURIComponent(item.matched_keywords?.join(', ') || trendsTopic)}`}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}
                          >
                            <PenTool size={13} />
                            <span>Write Blog Post</span>
                          </Link>

                          <Link
                            href={`/social?topic=${encodeURIComponent(item.title)}`}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1, justifyContent: 'center' }}
                          >
                            <Share2 size={13} />
                            <span>Create Social Post</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleCopyTopic(item, idx)}
                            className="btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                            title="Copy topic brief"
                          >
                            {copiedTopicIdx === idx ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TRENDING KEYWORDS SELECTION TABLE / CARDS                 */}
              {/* ======================================================== */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Header & Filter Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>🔥 Trending Keywords Selector</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {selectedTrendKeywords.length} of {allTrendKeywords.length} Selected
                      </span>
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.825rem', marginTop: 2 }}>
                      Select high-growth search queries to copy, store in your library, or launch into Blog Writer and Pipeline Studio.
                    </p>
                  </div>

                  {/* Filter Sub-Tabs */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setTrendKeywordsFilter('all')}
                      className={trendKeywordsFilter === 'all' ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                    >
                      All ({allTrendKeywords.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendKeywordsFilter('rising')}
                      className={trendKeywordsFilter === 'rising' ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                    >
                      🔥 Rising Breakouts ({trendsResult.rising_keywords.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrendKeywordsFilter('top')}
                      className={trendKeywordsFilter === 'top' ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                    >
                      ⭐ Top Volume ({trendsResult.top_keywords.length})
                    </button>
                  </div>
                </div>

                {/* Search & Quick Selection Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ position: 'relative', width: 280 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
                    <input
                      style={{ width: '100%', paddingLeft: 30, fontSize: '0.825rem' }}
                      placeholder="Filter trend keywords..."
                      value={trendSearchTerm}
                      onChange={(e) => setTrendSearchTerm(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleSelectAllVisible(visibleTrendKeywords)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                    >
                      <CheckSquare size={13} />
                      <span>Select All Visible</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectRisingOnly}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                    >
                      <Flame size={13} color="#ef4444" />
                      <span>Select Rising Only</span>
                    </button>

                    {selectedTrendKeywords.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '5px 10px', color: '#ef4444' }}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>

                {/* Keywords Grid / List */}
                {visibleTrendKeywords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
                    <Search size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.85rem' }}>No keywords match the search filter.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
                    {visibleTrendKeywords.map((kwItem, i) => {
                      const isSelected = selectedTrendKeywords.includes(kwItem.keyword);
                      const isBreakout = kwItem.category === 'breakout' || kwItem.value?.toLowerCase().includes('breakout');
                      return (
                        <div
                          key={i}
                          onClick={() => toggleSelectTrendKeyword(kwItem.keyword)}
                          style={{
                            background: isSelected ? '#eff6ff' : '#f8fafc',
                            border: `1px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                            borderRadius: 8,
                            padding: '10px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{ color: isSelected ? '#3b82f6' : '#94a3b8' }}>
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? '#1d4ed8' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {kwItem.keyword}
                              </div>
                              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                                <span className={`badge ${kwItem.search_intent === 'commercial' ? 'badge-warning' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                                  {kwItem.search_intent}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                  {kwItem.type === 'rising' ? 'Rising Trend' : 'Top Search'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Velocity / Surge Metric Badge */}
                          <div style={{ marginLeft: 8 }}>
                            <span
                              style={{
                                background: isBreakout ? '#fef2f2' : kwItem.type === 'rising' ? '#ecfdf5' : '#eff6ff',
                                color: isBreakout ? '#dc2626' : kwItem.type === 'rising' ? '#059669' : '#2563eb',
                                border: `1px solid ${isBreakout ? '#fca5a5' : kwItem.type === 'rising' ? '#a7f3d0' : '#bfdbfe'}`,
                                borderRadius: 12,
                                padding: '3px 8px',
                                fontSize: '0.725rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              {isBreakout && <Flame size={12} />}
                              {kwItem.growth_rate || kwItem.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State for Trends Tab */
            <div style={{ background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', padding: 60, textAlign: 'center', color: '#64748b' }}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Flame size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Search Real-Time Google Trends
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: 520, margin: '8px auto 20px', lineHeight: 1.5 }}>
                Enter any topic or select one of the trending chips above. SerpApi queries Google Trends to reveal current breakout queries (+5000%), rising search velocity, and actionable content angles.
              </p>
              <button
                type="button"
                onClick={() => handleSearchTrends()}
                className="btn-primary"
                style={{ padding: '8px 24px', fontSize: '0.875rem', background: '#ef4444', borderColor: '#dc2626' }}
              >
                <Flame size={15} />
                <span>Search Trends for "{trendsTopic}"</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* FLOATING ACTION TOOLBAR FOR SELECTED KEYWORDS             */}
          {/* ======================================================== */}
          {selectedTrendKeywords.length > 0 && (
            <div
              style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#0f172a',
                color: 'white',
                padding: '12px 24px',
                borderRadius: 50,
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                zIndex: 100,
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                <span className="badge" style={{ background: '#ef4444', color: 'white', fontWeight: 800 }}>
                  {selectedTrendKeywords.length}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Keywords Selected</span>
              </div>

              {/* Action 1: Copy */}
              <button
                type="button"
                onClick={handleCopySelectedTrends}
                className="btn-secondary"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'transparent', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {copiedTrends ? <CheckCheck size={14} color="#4ade80" /> : <Copy size={14} />}
                <span>{copiedTrends ? 'Copied!' : 'Copy'}</span>
              </button>

              {/* Action 2: Save to Library */}
              <button
                type="button"
                onClick={handleSaveSelectedKeywords}
                disabled={savingTrendKeywords}
                className="btn-secondary"
                style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'transparent', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Download size={14} />
                <span>{savingTrendKeywords ? 'Saving...' : 'Save to Library'}</span>
              </button>

              {/* Action 3: Write Blog */}
              <button
                type="button"
                onClick={handleOpenWriterWithSelected}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#3b82f6', borderColor: '#2563eb' }}
              >
                <PenTool size={14} />
                <span>Write Blog</span>
              </button>

              {/* Action 4: Launch Pipeline */}
              <button
                type="button"
                onClick={handleOpenPipelineWithSelected}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderColor: '#7c3aed' }}
              >
                <Sparkles size={14} />
                <span>Launch in Pipeline</span>
              </button>

              {/* Clear */}
              <button
                type="button"
                onClick={handleClearSelection}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MULTI-PLATFORM OMNI-PRESENCE                      */}
      {/* ======================================================== */}
      {activeTab === 'multi_platform' && (
        <div>
          {/* Skill 2 Form */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <form onSubmit={handleGenerateMultiPlatform} style={{ display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: 14, alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Skill, Digital Product, or Solution
                </label>
                <input
                  style={{ width: '100%', fontSize: '0.95rem', padding: '10px 14px' }}
                  placeholder="e.g. AI-powered workflow automation with n8n"
                  value={mpTopic}
                  onChange={(e) => setMpTopic(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Target Market
                </label>
                <select
                  style={{ width: '100%', fontSize: '0.9rem', padding: '10px' }}
                  value={mpBusinessType}
                  onChange={(e) => setMpBusinessType(e.target.value)}
                >
                  <option value="B2B">B2B Enterprise</option>
                  <option value="B2C">B2C Consumers</option>
                  <option value="SMB">SMB & Freelancers</option>
                </select>
              </div>
              <button type="submit" disabled={mpLoading} className="btn-primary" style={{ height: 42, padding: '0 24px' }}>
                <Sparkles size={16} />
                <span>{mpLoading ? 'Mapping Omnipresence...' : 'Run Multi-Platform Research'}</span>
              </button>
            </form>
          </div>

          {mpResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Seed Keywords Box */}
              <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      Google Keyword Planner Seed Keywords (1-4 Words)
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Paste these short, proven keywords directly into Google Keyword Planner, Ahrefs, or SEMrush to reveal volume.
                    </p>
                  </div>
                  <button onClick={handleCopySeeds} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <Copy size={14} />
                    <span>{copiedSeeds ? 'Copied All!' : 'Copy for Keyword Planner'}</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {mpResult.seed_keywords?.map((seed, idx) => (
                    <span key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      {idx + 1}. {seed}
                    </span>
                  ))}
                </div>
              </div>

              {/* 8 Platform Groups Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
                {Object.entries(mpResult.platform_groups || {}).map(([platformKey, items]) => (
                  <div key={platformKey} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                        {platformKey.replace(/_/g, ' ')}
                      </h4>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {items.length} keywords
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {items.map((kwItem, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, fontSize: '0.825rem' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{kwItem.keyword}</span>
                          <span className={`badge ${kwItem.tag === 'V' ? 'badge-success' : kwItem.tag === 'E' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                            [{kwItem.tag}] {kwItem.tag === 'V' ? 'Volume' : kwItem.tag === 'E' ? 'Emerging' : 'Intent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Wins & Strategy */}
              {mpResult.quick_wins?.length > 0 && (
                <div style={{ background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0', padding: 20 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46', marginBottom: 10 }}>
                    🚀 3 Quick Win Platform Opportunities
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                    {mpResult.quick_wins.map((w, idx) => (
                      <div key={idx} style={{ background: 'white', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                        <strong style={{ color: '#065f46' }}>{w.platform}:</strong> {w.opportunity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center', color: '#64748b' }}>
              <Globe size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>No Multi-Platform Research Run Yet</h4>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                Enter your offering or skill above to generate Google Keyword Planner seed keywords and 8-channel native coverage.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: STANDARD 10-CATEGORY VIEW                         */}
      {/* ======================================================== */}
      {activeTab === 'standard' && (
        <div>
          {/* Input Generator Bar */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Target Core Topic / Market Objective
                </label>
                <input
                  style={{ width: '100%', fontSize: '0.95rem', padding: '10px 14px' }}
                  placeholder="e.g. Multi-Tenant AI Architecture"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary" style={{ height: 42, padding: '0 24px' }}>
                <Sparkles size={16} />
                <span>{loading ? 'Mining Keywords...' : 'Generate Keywords'}</span>
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, fontSize: '0.8rem', color: '#64748b' }}>
              <span>Active Brand: <strong>{activeBrand?.name || 'Default'}</strong></span>
              <span>•</span>
              <span>Knowledge Collection: <strong>{activeCollection?.name || 'All References'}</strong></span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669' }}>
                <ShieldCheck size={14} />
                <span>SEO Data Provider Layer: Honest Metrics (No Fabricated Volumes)</span>
              </span>
            </div>
          </div>

          {/* Categories Filter Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', textTransform: 'capitalize' }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
              <input
                style={{ width: '100%', paddingLeft: 30, fontSize: '0.825rem' }}
                placeholder="Search keywords..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Keywords Table */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {filteredKeywords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <KeyRound size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>No Keywords Found</h4>
                <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Generate keywords above to populate 10 strategic categories.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Keyword</th>
                    <th style={{ padding: '12px 16px' }}>Category</th>
                    <th style={{ padding: '12px 16px' }}>Intent</th>
                    <th style={{ padding: '12px 16px' }}>Relevance</th>
                    <th style={{ padding: '12px 16px' }}>Suggested Format</th>
                    <th style={{ padding: '12px 16px' }}>Supporting Reference</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((k) => (
                    <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{k.keyword}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-primary">{k.category}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge badge-neutral">{k.search_intent}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 40, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round(k.relevance_score * 100)}%`, height: '100%', background: '#6366f1' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{k.relevance_score}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.8rem' }}>
                        {k.suggested_content_type || 'Article'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {k.supporting_reference || 'Domain Context'}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <Link
                          href={`/topics?keyword=${encodeURIComponent(k.keyword)}`}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>Generate Topics</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
