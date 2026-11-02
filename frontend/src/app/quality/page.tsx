'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Sparkles,
  ArrowRight, FileText, RefreshCw, Wand2, ShieldAlert
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { GeneratedContent, ContentEvaluation } from '@/types';

function QualityStudioContent() {
  const searchParams = useSearchParams();
  const contentIdParam = searchParams.get('contentId');

  const { showToast } = useApp();

  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string>(contentIdParam || '');
  const [evaluation, setEvaluation] = useState<ContentEvaluation | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);

  useEffect(() => {
    async function loadContents() {
      try {
        const list = await apiClient.getContentList();
        setContents(list);
        if (!selectedContentId && list.length > 0) {
          setSelectedContentId(list[0].id);
        }
      } catch (e) {}
    }
    loadContents();
  }, []);

  useEffect(() => {
    if (contentIdParam) {
      setSelectedContentId(contentIdParam);
    }
  }, [contentIdParam]);

  const handleRunEvaluation = async () => {
    if (!selectedContentId) {
      showToast('Please select content to evaluate', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.evaluateContent(selectedContentId);
      setEvaluation(res);
      showToast(`Quality audit complete. Overall Score: ${res.overall_score}/100`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Quality audit failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImproveContent = async () => {
    if (!selectedContentId) return;
    setImproving(true);
    try {
      const improved = await apiClient.improveContentFromReport(selectedContentId);
      showToast('Content enhanced based on quality audit report!', 'success');
      // Re-run evaluation on the newly improved draft
      const reEval = await apiClient.evaluateContent(improved.id);
      setEvaluation(reEval);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Content enhancement failed', 'error');
    } finally {
      setImproving(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#6366f1';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            12-Factor Content Quality & Fact-Checking Engine
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Rigorous evaluation of factual grounding, reference fidelity, tone consistency, and platform compliance.
          </p>
        </div>
      </div>

      {/* Selector & Audit Trigger Bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Select Draft to Audit
            </label>
            <select
              style={{ width: '100%', fontSize: '0.95rem' }}
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
            >
              {contents.length === 0 ? (
                <option value="">No generated content found in library</option>
              ) : (
                contents.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.platform}] {c.title} ({c.word_count} words)
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={loading || !selectedContentId}
            className="btn-primary"
            style={{ height: 42, padding: '0 24px' }}
          >
            <ShieldCheck size={16} />
            <span>{loading ? 'Auditing 12 Dimensions...' : 'Run Quality Audit'}</span>
          </button>
        </div>
      </div>

      {/* Evaluation Results */}
      {evaluation ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Score Card */}
          <div style={{
            background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
            padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                border: `6px solid ${getScoreColor(evaluation.overall_score)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
                  {Math.round(evaluation.overall_score)}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>OUT OF 100</span>
              </div>

              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {evaluation.overall_score >= 85 ? 'Publication Grade Quality' : 'Improvements Recommended'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
                  Audited against retrieved reference documents, brand voice rules, and platform constraints.
                </p>
              </div>
            </div>

            <button
              onClick={handleImproveContent}
              disabled={improving}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.9rem', background: '#059669' }}
            >
              <Wand2 size={16} />
              <span>{improving ? 'Auto-Improving Draft...' : 'Improve Content Based on Quality Report'}</span>
            </button>
          </div>

          {/* 12 Dimensions Grid */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
              12-Dimension Quality Breakdown (0 to 10 Scale)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {Object.entries(evaluation.dimension_scores).map(([dim, score]) => {
                const label = dim.replace(/_/g, ' ');
                return (
                  <div key={dim} style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', textTransform: 'capitalize' }}>
                        {label}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: getScoreColor(score * 10) }}>
                        {score} / 10
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${score * 10}%`, height: '100%', background: getScoreColor(score * 10) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fact-Checking & Issues Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Unsupported Claims (Fact check against reference material) */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#ef4444' }}>
                <ShieldAlert size={18} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Unsupported Claims & Citations</h3>
              </div>
              {evaluation.unsupported_claims.length === 0 ? (
                <div style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, padding: '12px 0' }}>
                  <CheckCircle2 size={16} />
                  <span>All factual statements match reference knowledge base.</span>
                </div>
              ) : (
                <ul style={{ paddingLeft: 18, fontSize: '0.85rem', color: '#991b1b', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {evaluation.unsupported_claims.map((claim, idx) => (
                    <li key={idx}>{claim}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Suggested Improvements */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: '#6366f1' }}>
                <Sparkles size={18} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Actionable Improvements</h3>
              </div>
              <ul style={{ paddingLeft: 18, fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {evaluation.suggested_improvements.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px dashed #cbd5e1', padding: 48, textAlign: 'center' }}>
          <ShieldCheck size={44} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>No Evaluation Run for this Draft</h4>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 4 }}>
            Select a draft from the dropdown above and click "Run Quality Audit" to measure factual accuracy and 12 quality metrics.
          </p>
        </div>
      )}
    </div>
  );
}

export default function QualityStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Quality Studio...</div>}>
      <QualityStudioContent />
    </Suspense>
  );
}
