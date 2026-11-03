'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { KeyRound, Sparkles, Download, Filter, Search, ArrowRight, ShieldCheck, Copy, CheckCircle2, Globe, Compass } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Keyword, MultiPlatformKeywordResult } from '@/types';

export default function KeywordsPage() {
  const { activeBrand, activeCollection, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'standard' | 'multi_platform'>('standard');

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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Keyword Research & Omni-Presence Engine
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Ground keyword discovery across 10 strategic categories or generate multi-platform seeds for Google Keyword Planner.
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
          onClick={() => setActiveTab('standard')}
          className={activeTab === 'standard' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem' }}
        >
          <KeyRound size={15} />
          <span>10-Category Search Engine Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('multi_platform')}
          className={activeTab === 'multi_platform' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem' }}
        >
          <Globe size={15} />
          <span>Omnipresence Multi-Platform (8 Channels + Planner Seeds)</span>
        </button>
      </div>

      {activeTab === 'multi_platform' ? (
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
      ) : (
        /* Standard 10-Category View */
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

