'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ListOrdered, Sparkles, Plus, Trash2, CheckCircle2, ArrowRight, PenTool, Edit3 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { ContentOutline, Topic, HeadingNode, FAQItem } from '@/types';

function OutlinesContent() {
  const searchParams = useSearchParams();
  const topicIdParam = searchParams.get('topicId');
  const router = useRouter();

  const { activeBrand, activeCollection, showToast } = useApp();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topicIdParam || '');
  const [outline, setOutline] = useState<ContentOutline | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable Outline Fields
  const [h1Heading, setH1Heading] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [cta, setCta] = useState('');

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await apiClient.getTopics(activeBrand?.id);
        setTopics(data);
        if (!selectedTopicId && data.length > 0) {
          setSelectedTopicId(data[0].id);
        }
      } catch (e) {}
    }
    loadTopics();
  }, [activeBrand]);

  useEffect(() => {
    if (topicIdParam) {
      setSelectedTopicId(topicIdParam);
    }
  }, [topicIdParam]);

  const handleGenerateOutline = async () => {
    if (!selectedTopicId) {
      showToast('Please select a topic first', 'error');
      return;
    }
    setLoading(true);
    try {
      const out = await apiClient.generateOutline(selectedTopicId, activeBrand?.id, activeCollection?.id);
      setOutline(out);
      setH1Heading(out.h1_heading);
      setMetaTitle(out.meta_title || '');
      setMetaDescription(out.meta_description || '');
      setUrlSlug(out.url_slug_suggestion || '');
      setHeadings(out.headings_hierarchy || []);
      setFaqs(out.faqs || []);
      setCta(out.cta || '');
      showToast('Comprehensive outline generated', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Outline generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOutline = async () => {
    if (!outline) return;
    setSaving(true);
    try {
      const updated = await apiClient.updateOutline(outline.id, {
        h1_heading: h1Heading,
        meta_title: metaTitle,
        meta_description: metaDescription,
        url_slug_suggestion: urlSlug,
        headings_hierarchy: headings,
        faqs,
        cta,
        status: 'approved'
      });
      setOutline(updated);
      showToast('Outline updated and approved', 'success');
    } catch (err: any) {
      showToast('Failed to update outline', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addHeading = () => {
    setHeadings([...headings, { h2: 'New Section Heading', h3: [], points: ['Key implementation point'] }]);
  };

  const removeHeading = (idx: number) => {
    setHeadings(headings.filter((_, i) => i !== idx));
  };

  const updateHeadingH2 = (idx: number, text: string) => {
    const updated = [...headings];
    updated[idx].h2 = text;
    setHeadings(updated);
  };

  const updateHeadingPoints = (idx: number, pointsStr: string) => {
    const updated = [...headings];
    updated[idx].points = pointsStr.split('\n').filter(Boolean);
    setHeadings(updated);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Content Outline Architect
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Create structured H1/H2/H3 hierarchies, meta descriptions, and FAQs before triggering the AI blog writer.
          </p>
        </div>
      </div>

      {/* Topic Selector & Generator Bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Select Topic to Outline
            </label>
            <select
              style={{ width: '100%', fontSize: '0.95rem' }}
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
            >
              {topics.length === 0 ? (
                <option value="">No topics found - Generate topics first</option>
              ) : (
                topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.content_format})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleGenerateOutline}
            disabled={loading || !selectedTopicId}
            className="btn-primary"
            style={{ height: 42, padding: '0 24px' }}
          >
            <Sparkles size={16} />
            <span>{loading ? 'Structuring Outline...' : 'Generate Outline'}</span>
          </button>
        </div>
      </div>

      {/* Outline Workspace */}
      {outline ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ListOrdered size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>Structured Outline</div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{outline.title}</h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSaveOutline} disabled={saving} className="btn-secondary">
                <CheckCircle2 size={16} />
                <span>{saving ? 'Saving...' : 'Save & Approve'}</span>
              </button>
              <Link
                href={`/writer?outlineId=${outline.id}`}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.875rem' }}
              >
                <PenTool size={16} />
                <span>Write Full Blog (500–3000w)</span>
              </Link>
            </div>
          </div>

          {/* Metadata Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                H1 Heading
              </label>
              <input
                style={{ width: '100%', fontWeight: 700 }}
                value={h1Heading}
                onChange={(e) => setH1Heading(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                URL Slug Suggestion
              </label>
              <input
                style={{ width: '100%', fontFamily: 'monospace' }}
                value={urlSlug}
                onChange={(e) => setUrlSlug(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Meta Title (under 60 chars)
              </label>
              <input
                style={{ width: '100%' }}
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Meta Description (140-155 chars)
              </label>
              <input
                style={{ width: '100%' }}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section Headings Hierarchy */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                H2 & H3 Section Hierarchy
              </h3>
              <button onClick={addHeading} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                <Plus size={14} />
                <span>Add Section</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {headings.map((node, idx) => (
                <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#6366f1' }}>H2:</span>
                      <input
                        style={{ width: '85%', fontWeight: 700 }}
                        value={node.h2}
                        onChange={(e) => updateHeadingH2(idx, e.target.value)}
                      />
                    </div>
                    <button onClick={() => removeHeading(idx)} className="btn-ghost" style={{ color: '#ef4444' }} title="Delete section">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      Key Discussion Points & Evidence (one per line)
                    </label>
                    <textarea
                      style={{ width: '100%', minHeight: 60, fontSize: '0.85rem' }}
                      value={(node.points || []).join('\n')}
                      onChange={(e) => updateHeadingPoints(idx, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
              Call to Action (CTA)
            </label>
            <input
              style={{ width: '100%' }}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button onClick={handleSaveOutline} disabled={saving} className="btn-secondary">
              {saving ? 'Saving...' : 'Save Draft Outline'}
            </button>
            <Link
              href={`/writer?outlineId=${outline.id}`}
              className="btn-primary"
              style={{ padding: '10px 22px', fontSize: '0.9rem' }}
            >
              <PenTool size={16} />
              <span>Generate Full Article in Blog Writer</span>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center' }}>
          <ListOrdered size={44} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>No Outline Generated Yet</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
            Select a topic above and click "Generate Outline" to construct an SEO heading architecture.
          </p>
        </div>
      )}
    </div>
  );
}

export default function OutlinesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Outlines...</div>}>
      <OutlinesContent />
    </Suspense>
  );
}
