'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { KeyRound, Sparkles, Download, Filter, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Keyword } from '@/types';

export default function KeywordsPage() {
  const { activeBrand, activeCollection, showToast } = useApp();

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [topicInput, setTopicInput] = useState('Enterprise AI Content Intelligence');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Intelligent Keyword Research Engine
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Ground keyword discovery across 10 strategic categories informed by reference materials and brand voice.
          </p>
        </div>
        <button onClick={handleExportCSV} disabled={keywords.length === 0} className="btn-secondary">
          <Download size={15} />
          <span>Export CSV</span>
        </button>
      </div>

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
  );
}
