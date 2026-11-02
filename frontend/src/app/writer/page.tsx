'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  PenTool, Sparkles, Download, CheckCircle2, ShieldCheck,
  FileText, Wand2, RefreshCw, Undo, Save, ExternalLink
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { GeneratedContent, ContentOutline } from '@/types';

function BlogWriterContent() {
  const searchParams = useSearchParams();
  const outlineIdParam = searchParams.get('outlineId');
  const contentIdParam = searchParams.get('id');

  const { activeBrand, activeCollection, showToast } = useApp();

  const [outline, setOutline] = useState<ContentOutline | null>(null);
  const [contentId, setContentId] = useState<string | null>(contentIdParam);
  
  // Editor State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [wordCountTarget, setWordCountTarget] = useState<number>(1500);
  const [writingTone, setWritingTone] = useState('Thought leadership');

  // AI In-line Editing Tools
  const [selectedText, setSelectedText] = useState('');
  const [aiAction, setAiAction] = useState('rewrite');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [runningAiTool, setRunningAiTool] = useState(false);

  // States
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      if (contentIdParam) {
        try {
          const c = await apiClient.getContent(contentIdParam);
          setTitle(c.title);
          setBody(c.body);
          setContentId(c.id);
        } catch (e) {}
      } else if (outlineIdParam) {
        try {
          const o = await apiClient.getOutline(outlineIdParam);
          setOutline(o);
          setTitle(o.title);
        } catch (e) {}
      }
    }
    loadInitial();
  }, [outlineIdParam, contentIdParam]);

  const handleGenerateBlog = async () => {
    setGenerating(true);
    try {
      const generated = await apiClient.generateBlog({
        outline_id: outline?.id || undefined,
        topic_title: title || 'Comprehensive Industry Guide',
        desired_word_count: wordCountTarget,
        writing_tone: writingTone,
        brand_id: activeBrand?.id,
        collection_id: activeCollection?.id
      });
      setContentId(generated.id);
      setTitle(generated.title);
      setBody(generated.body);
      showToast(`Article generated (${generated.word_count} words)`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Blog generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!contentId) {
      showToast('Generate or create an article first', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiClient.updateContent(contentId, { title, body });
      showToast('Article saved (new version created)', 'success');
    } catch (err: any) {
      showToast('Failed to save article', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAiEdit = async () => {
    const textToModify = selectedText.trim() || body;
    if (!textToModify) {
      showToast('Please select text or write content first', 'error');
      return;
    }
    setRunningAiTool(true);
    try {
      const res = await apiClient.rewriteText({
        selected_text: textToModify,
        action: aiAction,
        custom_instruction: customAiPrompt || undefined
      });

      if (selectedText.trim()) {
        // Replace only the selected text in the body
        setBody((prev) => prev.replace(selectedText, res.revised_text));
        showToast(`AI ${aiAction} applied to selected text`, 'success');
        setSelectedText('');
      } else {
        // Replace full body
        setBody(res.revised_text);
        showToast(`AI ${aiAction} applied to draft`, 'success');
      }
    } catch (err: any) {
      showToast('AI editing failed', 'error');
    } finally {
      setRunningAiTool(false);
    }
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charCount = body.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            AI Blog & Article Writer
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Ground your long-form articles in reference materials. Includes word count targeting, structured headings, and precision AI inline editing tools.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {contentId && (
            <>
              <a
                href={apiClient.getExportUrl(contentId, 'docx')}
                className="btn-secondary"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              >
                <Download size={14} />
                <span>DOCX</span>
              </a>
              <a
                href={apiClient.getExportUrl(contentId, 'pdf')}
                className="btn-secondary"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              >
                <Download size={14} />
                <span>PDF</span>
              </a>
              <Link
                href={`/quality?contentId=${contentId}`}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '8px 12px', background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
              >
                <ShieldCheck size={15} />
                <span>12-Factor Quality Audit</span>
              </Link>
            </>
          )}

          <button onClick={handleSave} disabled={saving || !contentId} className="btn-primary">
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Article'}</span>
          </button>
        </div>
      </div>

      {/* Generation Config Bar */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Target Word Count:</span>
            {[500, 800, 1000, 1500, 2000, 3000].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWordCountTarget(w)}
                className={wordCountTarget === w ? 'btn-primary' : 'btn-ghost'}
                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              >
                {w}w
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Tone: <strong>{activeBrand?.writing_tone || writingTone}</strong>
            </div>
            <button
              onClick={handleGenerateBlog}
              disabled={generating}
              className="btn-primary"
              style={{ background: '#4338ca', padding: '8px 20px' }}
            >
              <Sparkles size={16} />
              <span>{generating ? 'Drafting Article via Gemini...' : 'Generate Full Draft'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two-Column Editor Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column: Context, Outline & AI Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI Precision Editing Toolbox */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Wand2 size={16} color="#6366f1" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>AI Editorial Assistant</h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>
              Highlight text in the editor, select an action, and enhance your draft with surgical precision.
            </p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Action
              </label>
              <select
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={aiAction}
                onChange={(e) => setAiAction(e.target.value)}
              >
                <option value="rewrite">Rewrite for Clarity</option>
                <option value="grammar">Fix Grammar & Syntax</option>
                <option value="professional">Make More Professional</option>
                <option value="conversational">Make More Conversational</option>
                <option value="simplify">Simplify & Plain English</option>
                <option value="expand">Expand & Deepen</option>
                <option value="shorten">Shorten & Condense</option>
                <option value="add_examples">Add Concrete Examples</option>
                <option value="improve_intro">Improve Introduction Hook</option>
                <option value="improve_conclusion">Strengthen Strategic Conclusion</option>
                <option value="generate_cta">Generate High-Converting CTA</option>
              </select>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Optional Custom Direction
              </label>
              <input
                style={{ width: '100%', fontSize: '0.8rem' }}
                placeholder="e.g. Focus on enterprise security..."
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
              />
            </div>

            <button
              onClick={handleApplyAiEdit}
              disabled={runningAiTool || !body}
              className="btn-primary"
              style={{ width: '100%', fontSize: '0.85rem', padding: '8px' }}
            >
              <Wand2 size={14} />
              <span>{runningAiTool ? 'Applying AI Edit...' : selectedText ? 'Apply to Selection' : 'Apply to Draft'}</span>
            </button>
          </div>

          {/* Outline Reference Panel */}
          {outline && (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', marginBottom: 8 }}>
                Approved Outline
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                {outline.h1_heading}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {outline.headings_hierarchy?.map((h, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#334155', borderLeft: '2px solid #6366f1', paddingLeft: 8 }}>
                    <strong>{h.h2}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Content Editor */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: 650 }}>
          {/* Article Title */}
          <input
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#0f172a',
              border: 'none',
              borderBottom: '1px solid #f1f5f9',
              borderRadius: 0,
              padding: '8px 0',
              marginBottom: 20,
              outline: 'none',
              boxShadow: 'none'
            }}
            placeholder="Article Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Main Body Textarea with Text Selection Listener */}
          <textarea
            style={{
              width: '100%',
              flex: 1,
              minHeight: 500,
              border: 'none',
              fontSize: '1rem',
              lineHeight: 1.7,
              color: '#1e293b',
              resize: 'vertical',
              outline: 'none',
              boxShadow: 'none',
              padding: 0,
              fontFamily: 'inherit'
            }}
            placeholder="Generate an article or start writing your publication draft..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onSelect={(e: any) => {
              const start = e.target.selectionStart;
              const end = e.target.selectionEnd;
              if (start !== end) {
                setSelectedText(body.substring(start, end));
              } else {
                setSelectedText('');
              }
            }}
          />

          {/* Editor Stats Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f1f5f9', marginTop: 16, fontSize: '0.8rem', color: '#64748b' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <span>Words: <strong>{wordCount.toLocaleString()}</strong> / {wordCountTarget}w</span>
              <span>Characters: <strong>{charCount.toLocaleString()}</strong></span>
              {selectedText && (
                <span style={{ color: '#6366f1', fontWeight: 600 }}>
                  ({selectedText.trim().split(/\s+/).length} words selected for AI tools)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
              <CheckCircle2 size={14} />
              <span>Reference Grounded Draft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlogWriterPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Writer...</div>}>
      <BlogWriterContent />
    </Suspense>
  );
}
