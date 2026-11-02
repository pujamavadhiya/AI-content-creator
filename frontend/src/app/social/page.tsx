'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Share2, Linkedin, Instagram, Facebook, Twitter,
  Sparkles, Copy, Check, Save, Download, Layers, ShieldCheck
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { GeneratedContent } from '@/types';

function SocialStudioContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topicTitle') || 'Why Reference-Driven AI Dominates Generic LLMs';

  const { activeBrand, activeCollection, showToast } = useApp();

  const [activePlatform, setActivePlatform] = useState<'linkedin' | 'instagram' | 'facebook' | 'twitter' | 'multi'>('linkedin');
  const [topicTitle, setTopicTitle] = useState(initialTopic);
  const [formatType, setFormatType] = useState('thought_leadership');
  const [slidesCount, setSlidesCount] = useState(7);
  const [tweetsCount, setTweetsCount] = useState(6);
  
  // Output states
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [multiResults, setMultiResults] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle) return;
    setLoading(true);
    setGeneratedContent(null);
    setMultiResults([]);

    try {
      if (activePlatform === 'multi') {
        const results = await apiClient.generateMultiPlatform({
          topic_title: topicTitle,
          platforms: ['blog', 'linkedin', 'instagram', 'facebook', 'twitter'],
          brand_id: activeBrand?.id,
          collection_id: activeCollection?.id
        });
        setMultiResults(results);
        showToast(`Successfully generated ${results.length} multi-platform assets`, 'success');
      } else {
        const result = await apiClient.generateSocial({
          topic_title: topicTitle,
          platform: activePlatform,
          format_type: formatType,
          brand_id: activeBrand?.id,
          collection_id: activeCollection?.id
        });
        setGeneratedContent(result);
        showToast(`${activePlatform.toUpperCase()} post generated`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Social generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Social Media Content Studio
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Generate platform-native content with hooks, carousel slide breakdowns, reels scripts, and Twitter threads grounded in your reference knowledge.
          </p>
        </div>
      </div>

      {/* Platform Selector Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActivePlatform('linkedin'); setFormatType('thought_leadership'); }}
          className={activePlatform === 'linkedin' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Linkedin size={16} />
          <span>LinkedIn Post</span>
        </button>

        <button
          onClick={() => { setActivePlatform('instagram'); setFormatType('carousel'); }}
          className={activePlatform === 'instagram' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Instagram size={16} />
          <span>Instagram (Carousel & Reel)</span>
        </button>

        <button
          onClick={() => { setActivePlatform('facebook'); setFormatType('community'); }}
          className={activePlatform === 'facebook' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Facebook size={16} />
          <span>Facebook Post</span>
        </button>

        <button
          onClick={() => { setActivePlatform('twitter'); setFormatType('thread'); }}
          className={activePlatform === 'twitter' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', fontSize: '0.85rem' }}
        >
          <Twitter size={16} />
          <span>Twitter / X Thread (&lt;280 chars)</span>
        </button>

        <button
          onClick={() => setActivePlatform('multi')}
          className={activePlatform === 'multi' ? 'btn-primary' : 'btn-secondary'}
          style={{
            padding: '10px 18px', fontSize: '0.85rem',
            background: activePlatform === 'multi' ? '#4f46e5' : '#eef2ff',
            color: activePlatform === 'multi' ? 'white' : '#4338ca',
            borderColor: '#c7d2fe'
          }}
        >
          <Layers size={16} />
          <span>Multi-Platform (1-to-All)</span>
        </button>
      </div>

      {/* Generator Configuration Card */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Topic Concept / Angle *
            </label>
            <input
              style={{ width: '100%', fontSize: '0.95rem' }}
              placeholder="e.g. 5 Lessons from Benchmarking 100 Enterprise RAG Pipelines"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
            {activePlatform !== 'multi' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Content Format
                </label>
                <select
                  style={{ width: '100%' }}
                  value={formatType}
                  onChange={(e) => setFormatType(e.target.value)}
                >
                  {activePlatform === 'linkedin' && (
                    <>
                      <option value="thought_leadership">Thought Leadership Breakdown</option>
                      <option value="storytelling">Storytelling & Lesson Learned</option>
                      <option value="company_announcement">Company & Product Announcement</option>
                      <option value="contrarian">Contrarian Perspective</option>
                    </>
                  )}
                  {activePlatform === 'instagram' && (
                    <>
                      <option value="carousel">Multi-Slide Educational Carousel</option>
                      <option value="reels">Viral Reel Voiceover Script</option>
                      <option value="caption">Engaging Visual Caption</option>
                    </>
                  )}
                  {activePlatform === 'facebook' && (
                    <>
                      <option value="community">Community Discussion</option>
                      <option value="business">Business Insight & Update</option>
                    </>
                  )}
                  {activePlatform === 'twitter' && (
                    <>
                      <option value="thread">Multi-Tweet Educational Thread</option>
                      <option value="single">Single Punchy Insight (&lt;280 chars)</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Brand: <strong>{activeBrand?.name || 'Default Voice'}</strong> • Collection: <strong>{activeCollection?.name || 'All Sources'}</strong>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ height: 42, padding: '0 28px' }}>
              <Sparkles size={16} />
              <span>{loading ? 'Generating with Gemini...' : activePlatform === 'multi' ? 'Generate 5 Platform Versions' : 'Generate Post'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Single Output View */}
      {generatedContent && activePlatform !== 'multi' && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-primary">{generatedContent.platform}</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>{generatedContent.title}</h2>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyToClipboard(generatedContent.body)} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <Link
                href={`/quality?contentId=${generatedContent.id}`}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
              >
                <ShieldCheck size={14} />
                <span>Audit Quality</span>
              </Link>
            </div>
          </div>

          {/* Visual Concept Banner */}
          {generatedContent.metadata_json?.visual_concept && (
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20, fontSize: '0.85rem', color: '#475569' }}>
              <strong>Visual Design Concept:</strong> {generatedContent.metadata_json.visual_concept}
            </div>
          )}

          {/* Body Content */}
          <div style={{
            background: '#f8fafc', padding: 24, borderRadius: 10, border: '1px solid #e2e8f0',
            whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.65, color: '#1e293b',
            fontFamily: activePlatform === 'twitter' ? 'monospace' : 'inherit'
          }}>
            {generatedContent.body}
          </div>

          {/* Slides Breakdown if Instagram Carousel */}
          {generatedContent.metadata_json?.slides && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                Carousel Slide-by-Slide Layout ({generatedContent.metadata_json.slides.length} Slides)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {generatedContent.metadata_json.slides.map((s: any, idx: number) => (
                  <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', marginBottom: 4 }}>Slide {s.slide_number || idx + 1}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: 6 }}>{s.headline}</div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 8 }}>{s.body}</div>
                    {s.visual_note && <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Note: {s.visual_note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Platform (1-to-All) Outputs View */}
      {multiResults.length > 0 && activePlatform === 'multi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Multi-Platform Assets Generated ({multiResults.length})
            </h2>
            <Link href="/library" className="btn-secondary" style={{ fontSize: '0.8rem' }}>
              <span>View All in Library →</span>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {multiResults.map((item) => (
              <div key={item.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 22, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="badge badge-primary">{item.platform}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.word_count} words</span>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                  {item.title}
                </h3>

                <div style={{
                  background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9',
                  fontSize: '0.85rem', color: '#334155', maxHeight: 180, overflowY: 'auto',
                  whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 16, flex: 1
                }}>
                  {item.body}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => copyToClipboard(item.body)} className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                  <Link href={`/writer?id=${item.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Open in Editor
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Social Studio...</div>}>
      <SocialStudioContent />
    </Suspense>
  );
}
