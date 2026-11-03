'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, CheckCircle2, ArrowRight, ArrowLeft, KeyRound,
  Compass, ListOrdered, PenTool, Share2, BookOpen, Building2,
  Globe, Download, Copy, FileText, ExternalLink, ShieldCheck, RefreshCw, Search, Wand2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Keyword, Topic, ContentOutline, SerpGapResult, UrlRewriteResult } from '@/types';

export default function ResearchWorkflowPage() {
  const router = useRouter();
  const { brands, activeBrand, setActiveBrand, collections, activeCollection, setActiveCollection, showToast } = useApp();

  const [researchMode, setResearchMode] = useState<'pipeline' | 'serp_gap' | 'url_rewrite'>('pipeline');

  // Pipeline Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [topicPrompt, setTopicPrompt] = useState('Enterprise Retrieval Augmented Generation Architecture');
  const [targetAudience, setTargetAudience] = useState('Chief Technology Officers & Engineering Directors');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [outline, setOutline] = useState<ContentOutline | null>(null);

  // Loading States
  const [generatingKeywords, setGeneratingKeywords] = useState(false);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);

  // Skill 4: SERP Gap Research State
  const [serpKeywords, setSerpKeywords] = useState<string[]>([
    'enterprise AI automation',
    'AI workflow tools',
    'RAG search architecture',
    'autonomous AI agents',
    'LLM orchestration platform'
  ]);
  const [serpNiche, setSerpNiche] = useState('Enterprise AI & Workflow Automation');
  const [serpContentType, setSerpContentType] = useState('blog');
  const [serpIntent, setSerpIntent] = useState('buyer');
  const [serpResult, setSerpResult] = useState<SerpGapResult | null>(null);
  const [serpLoading, setSerpLoading] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  // Skill 3: Live Page Audit & AEO Content Rewriter State
  const [urlInput, setUrlInput] = useState('https://mxicoders.com/services/ai-development');
  const [primaryKwInput, setPrimaryKwInput] = useState('Enterprise AI Development Services');
  const [pageTypeInput, setPageTypeInput] = useState('service');
  const [authorNameInput, setAuthorNameInput] = useState('Ashok Rathod - Tech Consultant');
  const [urlRewriteResult, setUrlRewriteResult] = useState<UrlRewriteResult | null>(null);
  const [urlRewriting, setUrlRewriting] = useState(false);
  const [copiedRewriteBody, setCopiedRewriteBody] = useState(false);

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

  const handleRunSerpGap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSerpLoading(true);
    try {
      const res = await apiClient.analyzeSerpGaps({
        keywords: serpKeywords.filter(Boolean),
        niche: serpNiche,
        content_type: serpContentType,
        intent_preference: serpIntent
      });
      setSerpResult(res);
      showToast('SERP Gap teardown complete! Found actionable content gaps and stats.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'SERP gap analysis failed', 'error');
    } finally {
      setSerpLoading(false);
    }
  };

  const handleExportSerpDocx = async () => {
    if (!serpResult) return;
    setExportingDocx(true);
    try {
      const blob = await apiClient.exportSerpGapDocx(serpResult);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SERP_Gap_${serpNiche.replace(/\s+/g, '_')}.docx`;
      a.click();
      showToast('Downloaded SERP Gap Research .docx report', 'success');
    } catch (e) {
      showToast('Failed to export .docx report', 'error');
    } finally {
      setExportingDocx(false);
    }
  };

  const handleRunUrlRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setUrlRewriting(true);
    try {
      const res = await apiClient.rewriteUrlContent({
        url: urlInput,
        primary_keyword: primaryKwInput,
        page_type: pageTypeInput,
        author_name: authorNameInput
      });
      setUrlRewriteResult(res);
      showToast('Live page analyzed and AEO replacement content produced!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'URL rewrite analysis failed', 'error');
    } finally {
      setUrlRewriting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Research & Intelligence Hub
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
          Comprehensive research workspace: guided end-to-end pipeline, SERP competitor gap research, and live page AEO rewrites.
        </p>
      </div>

      {/* Mode Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          onClick={() => setResearchMode('pipeline')}
          className={researchMode === 'pipeline' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem' }}
        >
          <Sparkles size={15} />
          <span>Guided Content Pipeline (6-Step)</span>
        </button>
        <button
          onClick={() => setResearchMode('serp_gap')}
          className={researchMode === 'serp_gap' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem' }}
        >
          <Search size={15} />
          <span>SERP Competitor Gap Research (.docx Export)</span>
        </button>
        <button
          onClick={() => setResearchMode('url_rewrite')}
          className={researchMode === 'url_rewrite' ? 'btn-primary' : 'btn-ghost'}
          style={{ fontSize: '0.875rem' }}
        >
          <Globe size={15} />
          <span>Live URL Audit & AEO Content Rewriter</span>
        </button>
      </div>

      {researchMode === 'pipeline' && (
        <div>
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
      )}

      {/* SKILL 4: SERP Gap Research View */}
      {researchMode === 'serp_gap' && (
        <div>
          {/* Input Form */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Competitive SERP Gap Teardown
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 18 }}>
              Tear apart top-ranking Google competitors across 5 keywords. Extract content gaps, verified stats, hard numbers, and export a Word .docx brief.
            </p>

            <form onSubmit={handleRunSerpGap} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Niche / Industry
                  </label>
                  <input
                    style={{ width: '100%', fontSize: '0.9rem', padding: '8px 12px' }}
                    value={serpNiche}
                    onChange={(e) => setSerpNiche(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Content Type
                    </label>
                    <select
                      style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                      value={serpContentType}
                      onChange={(e) => setSerpContentType(e.target.value)}
                    >
                      <option value="blog">Blog / Article</option>
                      <option value="service">Service / Landing Page</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Question Intent
                    </label>
                    <select
                      style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                      value={serpIntent}
                      onChange={(e) => setSerpIntent(e.target.value)}
                    >
                      <option value="buyer">Buyer Intent</option>
                      <option value="informational">Informational</option>
                      <option value="mixed">Mixed Intent</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  5 Target Keywords (1 per line or comma-separated)
                </label>
                <input
                  style={{ width: '100%', fontSize: '0.9rem', padding: '8px 12px' }}
                  value={serpKeywords.join(', ')}
                  onChange={(e) => setSerpKeywords(e.target.value.split(',').map(s => s.trim()))}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="submit" disabled={serpLoading} className="btn-primary" style={{ padding: '10px 24px' }}>
                  <Sparkles size={16} />
                  <span>{serpLoading ? 'Analyzing SERP Competitors...' : 'Run SERP Gap Analysis'}</span>
                </button>
              </div>
            </form>
          </div>

          {serpResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Header with Export */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    SERP Gap Research Report: {serpResult.niche}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                    Analyzed against: {serpResult.keywords?.join(' • ')}
                  </p>
                </div>
                <button onClick={handleExportSerpDocx} disabled={exportingDocx} className="btn-secondary">
                  <Download size={16} />
                  <span>{exportingDocx ? 'Generating Word Doc...' : 'Download Word Doc (.docx)'}</span>
                </button>
              </div>

              {/* Sub-50-word AI Overview */}
              <div style={{ background: '#ecfdf5', borderRadius: 12, border: '1px solid #a7f3d0', padding: 20 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: 6 }}>
                  1. AI Overview Summary (Under 50 Words)
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#064e3b', lineHeight: 1.5 }}>
                  "{serpResult.ai_overview_summary}"
                </p>
              </div>

              {/* High-Value Content Gaps */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                  🚨 What Top Competitors Missed (Critical Content Gaps)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
                  {serpResult.content_gaps?.map((gap, i) => (
                    <div key={i} style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: 14, borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem', marginBottom: 4 }}>
                        {gap.gap_area}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#78350f' }}>{gap.why_it_matters}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vague Advice to Replace */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                  ✂️ Generic Competitor Claims to Replace with Concrete Depth
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {serpResult.vague_generic_content_to_replace?.map((item, i) => (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 14, borderRadius: 8, fontSize: '0.85rem' }}>
                      <div style={{ color: '#ef4444', textDecoration: 'line-through', marginBottom: 4 }}>
                        Competitor claim: "{item.competitor_claim}"
                      </div>
                      <div style={{ color: '#64748b', marginBottom: 6 }}>
                        Why it's weak: {item.flaw}
                      </div>
                      <div style={{ color: '#059669', fontWeight: 600 }}>
                        Our Solution: {item.how_we_fix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real Stats & Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                    📊 3 Verified Statistics (With Sources)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {serpResult.statistics?.map((st, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{st.stat}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Source: {st.source_name} ({st.year}) — <a href={st.source_url} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{st.source_url}</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                    📈 3 Hard Numbers & Benchmarks
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {serpResult.hard_numbers?.map((hn, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                          {hn.metric_type}: <span style={{ color: '#6366f1' }}>{hn.number}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Source: {hn.source_name} — <a href={hn.source_url} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{hn.source_url}</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* People Also Ask */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
                  ❓ People Also Ask (Search Intent Questions)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
                  {serpResult.people_also_ask?.map((q, i) => (
                    <div key={i} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                        {i + 1}. {q.question}
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                        {q.intent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SKILL 3: Live URL Audit & AEO Content Rewriter */}
      {researchMode === 'url_rewrite' && (
        <div>
          {/* Input Form */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Live Page URL Audit & AEO Content Rewriter
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 18 }}>
              Diagnoses a live URL for technical gaps and rewrites it for Google AI Mode, ChatGPT Search, and Perplexity with comparison tables and FAQs.
            </p>

            <form onSubmit={handleRunUrlRewrite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Target Live URL
                </label>
                <input
                  style={{ width: '100%', fontSize: '0.9rem', padding: '8px 12px' }}
                  placeholder="https://example.com/page-to-rewrite"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Primary Keyword this Page Should Own
                </label>
                <input
                  style={{ width: '100%', fontSize: '0.9rem', padding: '8px 12px' }}
                  value={primaryKwInput}
                  onChange={(e) => setPrimaryKwInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Page Purpose
                </label>
                <select
                  style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
                  value={pageTypeInput}
                  onChange={(e) => setPageTypeInput(e.target.value)}
                >
                  <option value="service">Service Page (Conversion & Objections)</option>
                  <option value="blog">Blog / Informational Guide</option>
                  <option value="landing">Landing Page Copy</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Author Credential Attribution
                </label>
                <input
                  style={{ width: '100%', fontSize: '0.9rem', padding: '8px 12px' }}
                  value={authorNameInput}
                  onChange={(e) => setAuthorNameInput(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={urlRewriting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  <Wand2 size={16} />
                  <span>{urlRewriting ? 'Auditing & Rewriting Live Page...' : 'Audit Page & Generate AEO Content'}</span>
                </button>
              </div>
            </form>
          </div>

          {urlRewriteResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Before Diagnosis Summary */}
              <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #cbd5e1', padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                  🔍 Before: Live Page Diagnosis
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 16 }}>
                  <div style={{ background: 'white', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Current Title Tag</div>
                    <strong>{urlRewriteResult.before_diagnosis?.current_title || 'None'}</strong>
                  </div>
                  <div style={{ background: 'white', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Current Word Count</div>
                    <strong>~{urlRewriteResult.before_diagnosis?.word_count || 0} words</strong>
                  </div>
                  <div style={{ background: 'white', padding: 12, borderRadius: 8, fontSize: '0.85rem' }}>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Schema Status</div>
                    <strong>{urlRewriteResult.before_diagnosis?.schema_status || 'Unverified'}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#92400e', background: '#fffbeb', padding: 12, borderRadius: 8, border: '1px solid #fef3c7' }}>
                  <strong>Identified Flaws:</strong>
                  <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                    {urlRewriteResult.before_diagnosis?.identified_gaps?.map((gap, i) => (
                      <li key={i}>{gap}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* What's Changing and Why */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                  ⚡ What's Changing and Why
                </h4>
                <ul style={{ paddingLeft: 20, fontSize: '0.875rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {urlRewriteResult.whats_changing_and_why?.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>

              {/* Replacement Content */}
              <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    ✨ Full CMS-Ready Replacement Content
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(urlRewriteResult.replacement_content.body_markdown);
                      setCopiedRewriteBody(true);
                      showToast('Copied full markdown replacement body to clipboard', 'success');
                      setTimeout(() => setCopiedRewriteBody(false), 3000);
                    }}
                    className="btn-secondary"
                  >
                    <Copy size={14} />
                    <span>{copiedRewriteBody ? 'Copied!' : 'Copy Markdown'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 18, background: '#f8fafc', padding: 16, borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>New Title Tag</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{urlRewriteResult.replacement_content.new_title_tag}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>New Meta Description</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{urlRewriteResult.replacement_content.new_meta_description}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Author Credit</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{urlRewriteResult.replacement_content.author_attribution}</strong>
                  </div>
                </div>

                {/* Body Markdown Content */}
                <div style={{ background: '#0f172a', color: '#f8fafc', padding: 20, borderRadius: 8, fontSize: '0.85rem', fontFamily: 'monospace', maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {urlRewriteResult.replacement_content.body_markdown}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

