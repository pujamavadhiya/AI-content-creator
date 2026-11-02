'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, KeyRound,
  Compass, ListOrdered, PenTool, Share2, BookOpen, Building2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Keyword, Topic, ContentOutline } from '@/types';

export default function ResearchWorkflowPage() {
  const router = useRouter();
  const { brands, activeBrand, setActiveBrand, collections, activeCollection, setActiveCollection, showToast } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [topicPrompt, setTopicPrompt] = useState('Enterprise Retrieval Augmented Generation Architecture');
  const [targetAudience, setTargetAudience] = useState('Chief Technology Officers & Engineering Directors');
  
  // Pipeline Data
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [outline, setOutline] = useState<ContentOutline | null>(null);

  // Loading States
  const [generatingKeywords, setGeneratingKeywords] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);

  const steps = [
    { num: 1, label: 'Brand & References' },
    { num: 2, label: 'Search Objective' },
    { num: 3, label: 'Keywords' },
    { num: 4, label: 'Topic Ideas' },
    { num: 5, label: 'Content Outline' },
    { num: 6, label: 'Generation Launch' },
  ];

  // Actions
  const handleGenerateKeywords = async () => {
    if (!topicPrompt) {
      showToast('Please enter a topic or content objective', 'error');
      return;
    }
    setGeneratingKeywords(true);
    try {
      const kw = await apiClient.generateKeywords({
        topic: topicPrompt,
        industry: activeBrand?.industry,
        target_audience: targetAudience,
        brand_id: activeBrand?.id,
        collection_id: activeCollection?.id
      });
      setKeywords(kw);
      setSelectedKeywords(kw.slice(0, 4).map((k) => k.keyword));
      showToast(`Generated ${kw.length} keywords across 10 categories`, 'success');
      setCurrentStep(3);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Keyword generation failed', 'error');
    } finally {
      setGeneratingKeywords(false);
    }
  };

  const handleGenerateTopics = async () => {
    if (selectedKeywords.length === 0) {
      showToast('Select at least one keyword', 'error');
      return;
    }
    setGeneratingTopics(true);
    try {
      const tp = await apiClient.generateTopics({
        primary_keyword: selectedKeywords[0],
        secondary_keywords: selectedKeywords.slice(1),
        industry: activeBrand?.industry,
        brand_id: activeBrand?.id,
        collection_id: activeCollection?.id
      });
      setTopics(tp);
      if (tp.length > 0) setSelectedTopic(tp[0]);
      showToast(`Generated ${tp.length} structured topic suggestions`, 'success');
      setCurrentStep(4);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Topic generation failed', 'error');
    } finally {
      setGeneratingTopics(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!selectedTopic) {
      showToast('Select a topic to outline', 'error');
      return;
    }
    setGeneratingOutline(true);
    try {
      const out = await apiClient.generateOutline(selectedTopic.id, activeBrand?.id, activeCollection?.id);
      setOutline(out);
      showToast('Detailed content outline generated', 'success');
      setCurrentStep(5);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Outline generation failed', 'error');
    } finally {
      setGeneratingOutline(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Research & Intelligence Workflow
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
          Reference Material → Content Understanding → Keywords → Topics → Outlines → Content Studio.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 24px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {steps.map((s, idx) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: isDone ? '#10b981' : isCurrent ? '#6366f1' : '#f1f5f9',
                    color: isDone || isCurrent ? 'white' : '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    {isDone ? <CheckCircle2 size={16} /> : s.num}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Step {s.num}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#0f172a' : '#64748b' }}>
                      {s.label}
                    </div>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: isDone ? '#10b981' : '#e2e8f0', margin: '0 16px' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Workspace Step Panels */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        {/* STEP 1: Brand & References Selection */}
        {currentStep === 1 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
              Step 1: Select Brand Profile & Reference Collection
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
              The selected brand voice and reference material ground all AI outputs in verified facts.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Building2 size={18} color="#6366f1" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Active Brand Profile</span>
                </div>
                <select
                  style={{ width: '100%', marginBottom: 12 }}
                  value={activeBrand?.id || ''}
                  onChange={(e) => setActiveBrand(brands.find((b) => b.id === e.target.value) || null)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.industry})</option>
                  ))}
                </select>
                {activeBrand && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                    Tone: <strong>{activeBrand.writing_tone}</strong> • Voice: <strong>{activeBrand.brand_voice}</strong>
                  </div>
                )}
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <BookOpen size={18} color="#0ea5e9" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Knowledge Collection</span>
                </div>
                <select
                  style={{ width: '100%', marginBottom: 12 }}
                  value={activeCollection?.id || ''}
                  onChange={(e) => setActiveCollection(collections.find((c) => c.id === e.target.value) || null)}
                >
                  <option value="">General Knowledge (No Collection Selected)</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.reference_count} docs)</option>
                  ))}
                </select>
                {activeCollection && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {activeCollection.reference_count} documents indexed in Qdrant Vector Store
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCurrentStep(2)} className="btn-primary">
                <span>Continue to Search Objective</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Objective & Topic */}
        {currentStep === 2 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
              Step 2: Define Core Content Objective & Audience
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
              What subject or market opportunity are you targeting?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Main Subject / Content Objective *</label>
                <input
                  style={{ width: '100%', fontSize: '0.95rem', padding: '10px 14px' }}
                  placeholder="e.g. The Future of AI in Enterprise Manufacturing"
                  value={topicPrompt}
                  onChange={(e) => setTopicPrompt(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Target Audience Persona</label>
                <input
                  style={{ width: '100%' }}
                  placeholder="e.g. VP of Supply Chain, Operations Directors"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(1)} className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button onClick={handleGenerateKeywords} disabled={generatingKeywords} className="btn-primary">
                <Sparkles size={16} />
                <span>{generatingKeywords ? 'Analyzing References & Keywords...' : 'Generate 10-Category Keywords'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Keywords */}
        {currentStep === 3 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
              Step 3: Review & Select Strategic Keywords
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
              Select primary and secondary keywords to guide topic ideation.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 28, maxHeight: 380, overflowY: 'auto' }}>
              {keywords.map((k) => {
                const isSelected = selectedKeywords.includes(k.keyword);
                return (
                  <div
                    key={k.id}
                    onClick={() => {
                      if (isSelected) setSelectedKeywords(selectedKeywords.filter((x) => x !== k.keyword));
                      else setSelectedKeywords([...selectedKeywords, k.keyword]);
                    }}
                    style={{
                      border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      background: isSelected ? '#eef2ff' : 'white',
                      padding: 14,
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span className="badge badge-primary">{k.category}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Score: {k.relevance_score}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{k.keyword}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Intent: {k.search_intent}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(2)} className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button onClick={handleGenerateTopics} disabled={generatingTopics} className="btn-primary">
                <Compass size={16} />
                <span>{generatingTopics ? 'Generating Topics & Formats...' : `Generate Topics from (${selectedKeywords.length}) Keywords`}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Choose Topic */}
        {currentStep === 4 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
              Step 4: Select Topic Suggestion
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
              AI has synthesized these topics matching your brand guidelines and reference knowledge.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28, maxHeight: 420, overflowY: 'auto' }}>
              {topics.map((t) => {
                const isSelected = selectedTopic?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTopic(t)}
                    style={{
                      border: isSelected ? '2px solid #6366f1' : '1px solid #e2e8f0',
                      background: isSelected ? '#eef2ff' : 'white',
                      padding: 18,
                      borderRadius: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className="badge badge-primary">{t.content_format}</span>
                        <span className="badge badge-neutral">{t.recommended_platform}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>{Math.round(t.relevance_score * 100)}% Match</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{t.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>{t.description}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(3)} className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button onClick={handleGenerateOutline} disabled={generatingOutline} className="btn-primary">
                <ListOrdered size={16} />
                <span>{generatingOutline ? 'Structuring Content Outline...' : 'Generate Detailed Outline'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Content Outline Review */}
        {currentStep === 5 && outline && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: '#0f172a' }}>
              Step 5: Review & Approve Content Outline
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
              Verify headings hierarchy, meta descriptions, and FAQs before generating the final draft.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 28 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>H1 Heading</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 16px' }}>{outline.h1_heading}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Meta Title: </span>
                  <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>{outline.meta_title}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Meta Description: </span>
                  <span style={{ fontSize: '0.85rem', color: '#0f172a' }}>{outline.meta_description}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: 16, marginBottom: 8 }}>
                Section Outline Structure:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {outline.headings_hierarchy.map((sec, idx) => (
                  <div key={idx} style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e1b4b' }}>## {sec.h2}</div>
                    {sec.points && (
                      <ul style={{ paddingLeft: 20, fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                        {sec.points.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setCurrentStep(4)} className="btn-secondary">
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button onClick={() => setCurrentStep(6)} className="btn-primary">
                <span>Approve Outline & Proceed to Generation</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Generation Launch */}
        {currentStep === 6 && outline && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Outline Approved & Ready for Generation!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 28px' }}>
              Select where you would like to generate content based on this approved topic and research outline.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Link
                href={`/writer?outlineId=${outline.id}`}
                className="btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              >
                <PenTool size={18} />
                <span>Generate Full Blog Post (500–3000w)</span>
              </Link>
              <Link
                href={`/social?topicTitle=${encodeURIComponent(outline.title)}`}
                className="btn-secondary"
                style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              >
                <Share2 size={18} />
                <span>Open Social Media Studio</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
