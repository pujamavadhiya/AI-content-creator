'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Compass, Sparkles, Network, ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Topic, TopicCluster } from '@/types';

function TopicsContent() {
  const searchParams = useSearchParams();
  const kwParam = searchParams.get('keyword');

  const { activeBrand, activeCollection, showToast } = useApp();

  const [primaryKeyword, setPrimaryKeyword] = useState(kwParam || 'AI Content Intelligence');
  const [secondaryKeywords, setSecondaryKeywords] = useState('RAG vector retrieval, brand voice consistency');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [clusters, setClusters] = useState<TopicCluster[]>([]);
  const [activeTab, setActiveTab] = useState<'topics' | 'clusters'>('topics');
  const [loading, setLoading] = useState(false);
  const [clustering, setClustering] = useState(false);

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await apiClient.getTopics(activeBrand?.id);
        setTopics(data);
      } catch (e) {}
    }
    loadTopics();
  }, [activeBrand]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryKeyword) return;
    setLoading(true);
    try {
      const generated = await apiClient.generateTopics({
        primary_keyword: primaryKeyword,
        secondary_keywords: secondaryKeywords.split(',').map((s) => s.trim()).filter(Boolean),
        industry: activeBrand?.industry,
        brand_id: activeBrand?.id,
        collection_id: activeCollection?.id
      });
      showToast(`Generated ${generated.length} topic suggestions`, 'success');
      setTopics(generated);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Topic generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCluster = async () => {
    setClustering(true);
    try {
      const cl = await apiClient.clusterTopics();
      setClusters(cl);
      setActiveTab('clusters');
      showToast(`Formed ${cl.length} semantic Pillar & Cluster hubs`, 'success');
    } catch (err: any) {
      showToast('Clustering requires at least 2 generated topics', 'error');
    } finally {
      setClustering(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Topic Generation & Semantic Clustering
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Generate 10–30 strategic topic suggestions across 12 content formats, and automatically cluster them into high-ranking Pillar & Cluster content hubs.
          </p>
        </div>
        <button onClick={handleCluster} disabled={clustering || topics.length < 2} className="btn-secondary">
          <Network size={16} />
          <span>{clustering ? 'Clustering Topics...' : 'Form Topic Clusters'}</span>
        </button>
      </div>

      {/* Generator Form */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleGenerate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Primary Keyword *
            </label>
            <input
              style={{ width: '100%', fontSize: '0.95rem' }}
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Secondary Keywords (comma separated)
            </label>
            <input
              style={{ width: '100%', fontSize: '0.95rem' }}
              value={secondaryKeywords}
              onChange={(e) => setSecondaryKeywords(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{ height: 42, padding: '0 24px' }}>
            <Sparkles size={16} />
            <span>{loading ? 'Synthesizing...' : 'Generate Topics'}</span>
          </button>
        </form>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('topics')}
          className={activeTab === 'topics' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          <Compass size={15} />
          <span>All Topics ({topics.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('clusters')}
          className={activeTab === 'clusters' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem' }}
        >
          <Layers size={15} />
          <span>Topic Clusters & Pillars ({clusters.length})</span>
        </button>
      </div>

      {/* Tab 1: All Topics */}
      {activeTab === 'topics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {topics.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center' }}>
              <Compass size={44} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>No Topics Generated Yet</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                Enter keywords above to generate high-performing topic concepts.
              </p>
            </div>
          ) : (
            topics.map((t) => (
              <div
                key={t.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  padding: 22,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="badge badge-primary">{t.content_format}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                    {Math.round(t.relevance_score * 100)}% Relevance
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 8, lineHeight: 1.4 }}>
                  {t.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
                  {t.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  <span className="badge badge-neutral">Keyword: {t.primary_keyword}</span>
                  <span className="badge badge-neutral">Platform: {t.recommended_platform}</span>
                </div>

                {t.supporting_reference_info && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 16 }}>
                    Reference basis: {t.supporting_reference_info}
                  </div>
                )}

                <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Status: {t.status}</span>
                  <Link
                    href={`/outlines?topicId=${t.id}`}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    <span>Generate Outline</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Clusters & Pillar Architecture */}
      {activeTab === 'clusters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {clusters.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center' }}>
              <Network size={44} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>No Topic Clusters Formed</h4>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4, marginBottom: 16 }}>
                Click "Form Topic Clusters" to automatically organize your topics into Pillar & Cluster content structures.
              </p>
              <button onClick={handleCluster} disabled={topics.length < 2} className="btn-primary">
                Form Topic Clusters Now
              </button>
            </div>
          ) : (
            clusters.map((c) => (
              <div key={c.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Network size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{c.cluster_name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Semantic Pillar & Cluster Model</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 }}>Pillar Guide Topic</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                    {c.pillar_topic ? c.pillar_topic.title : 'Primary Pillar Content'}
                  </div>
                </div>

                {c.internal_linking_strategy && (
                  <div style={{ fontSize: '0.85rem', color: '#475569', background: '#ecfdf5', padding: 12, borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 16 }}>
                    <strong>Internal Linking Strategy:</strong> {c.internal_linking_strategy}
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Cluster Supporting Subtopics ({c.supporting_topics?.length || 0})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                  {c.supporting_topics?.map((sup, sIdx) => (
                    <div key={sIdx} style={{ background: 'white', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      {sup.title}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Topics...</div>}>
      <TopicsContent />
    </Suspense>
  );
}
