'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Share2, Linkedin, Instagram, Facebook, Twitter,
  Sparkles, Copy, Check, Save, Download, Layers, ShieldCheck,
  MessageSquare, Send, RotateCcw, History, Bot, User, Wand2,
  RefreshCw, CheckCircle, ArrowRight
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { GeneratedContent } from '@/types';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  versionNumber: number;
  instruction?: string;
  timestamp: string;
  wordCount: number;
  characterCount: number;
}

const QUICK_INSTRUCTION_PILLS = [
  { label: '⚡ Make it punchier & shorter', text: 'Make this post 30% shorter, punchier, and remove any fluff while keeping the core insight.' },
  { label: '🎯 Add strong Call-To-Action', text: 'Add an engaging, discussion-provoking question and Call-To-Action at the end to maximize comments.' },
  { label: '🏷️ Add 5 viral hashtags', text: 'Add 5 highly relevant, high-traffic industry hashtags at the bottom of the post.' },
  { label: '💬 Conversational peer tone', text: 'Rewrite in a natural, candid peer-to-peer conversational tone. Use contractions (it\'s, don\'t) and direct phrasing.' },
  { label: '📊 Add 3 bullet metrics', text: 'Add 3 bulleted takeaway points with concrete numbers, percentages, or measurable insights.' },
  { label: '🔥 Provocative hook', text: 'Rewrite the opening 2 lines to be a sharp, pattern-interrupting hook that stops users from scrolling.' },
  { label: '📱 Mobile-friendly spacing', text: 'Reformat with short 1-2 sentence paragraphs and clean whitespace optimized for mobile reading.' },
];

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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Conversational Chat Interface States
  const [chatProvider, setChatProvider] = useState<'gemini' | 'openai' | 'claude'>('gemini');
  const [chatTurns, setChatTurns] = useState<ChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message when new turn is added
  useEffect(() => {
    if (chatTurns.length > 1) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatTurns, refining]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle) return;
    setLoading(true);
    setGeneratedContent(null);
    setMultiResults([]);
    setChatTurns([]);
    setActiveVersionNumber(1);

    try {
      if (activePlatform === 'multi') {
        const results = await apiClient.generateMultiPlatform({
          topic_title: topicTitle,
          platforms: ['blog', 'linkedin', 'instagram', 'facebook', 'twitter'],
          brand_id: activeBrand?.id,
          collection_id: activeCollection?.id,
          provider: chatProvider,
        });
        setMultiResults(results);
        showToast(`Successfully generated ${results.length} multi-platform assets`, 'success');
      } else {
        const result = await apiClient.generateSocial({
          topic_title: topicTitle,
          platform: activePlatform,
          format_type: formatType,
          brand_id: activeBrand?.id,
          collection_id: activeCollection?.id,
          provider: chatProvider,
        });
        setGeneratedContent(result);

        // Initialize Chat Thread with Version 1 (Initial Generation)
        const initialTurn: ChatTurn = {
          id: 'v1-' + Date.now(),
          role: 'assistant',
          content: result.body,
          versionNumber: 1,
          instruction: 'Initial Generation',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wordCount: result.word_count || result.body.split(/\s+/).length,
          characterCount: result.character_count || result.body.length,
        };
        setChatTurns([initialTurn]);
        setActiveVersionNumber(1);

        showToast(`${activePlatform.toUpperCase()} post generated (Version 1)`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Social generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Conversational Refinement - Send Chat Instruction
  const handleSendInstruction = async (instructionText?: string) => {
    const instruction = (instructionText || chatInput).trim();
    if (!instruction || !generatedContent || refining) return;

    // 1. Append user instruction to chat
    const userTurn: ChatTurn = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: instruction,
      versionNumber: activeVersionNumber,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wordCount: instruction.split(/\s+/).length,
      characterCount: instruction.length,
    };

    setChatTurns((prev) => [...prev, userTurn]);
    setChatInput('');
    setRefining(true);

    try {
      // Build conversation history payload for LLM context
      const historyPayload = chatTurns.map((t) => ({
        role: t.role,
        content: t.content,
      }));

      const res = await apiClient.socialChatRefine({
        content_id: generatedContent.id,
        platform: activePlatform === 'multi' ? 'linkedin' : activePlatform,
        current_content: generatedContent.body,
        instruction: instruction,
        conversation_history: historyPayload,
        provider: chatProvider,
        brand_id: activeBrand?.id,
      });

      const nextVer = res.version_number;

      // 2. Append new assistant version to chat
      const assistantTurn: ChatTurn = {
        id: 'v' + nextVer + '-' + Date.now(),
        role: 'assistant',
        content: res.refined_content,
        versionNumber: nextVer,
        instruction: instruction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        wordCount: res.word_count,
        characterCount: res.character_count,
      };

      setChatTurns((prev) => [...prev, assistantTurn]);
      setActiveVersionNumber(nextVer);

      // 3. Update active generated content card
      setGeneratedContent((prev) => prev ? {
        ...prev,
        body: res.refined_content,
        word_count: res.word_count,
        character_count: res.character_count,
      } : null);

      showToast(`Version ${nextVer} generated based on your instructions!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Refinement failed', 'error');
    } finally {
      setRefining(false);
    }
  };

  // Restore any previous version to active post
  const handleRestoreVersion = async (turn: ChatTurn) => {
    if (turn.role !== 'assistant') return;

    setActiveVersionNumber(turn.versionNumber);
    setGeneratedContent((prev) => prev ? {
      ...prev,
      body: turn.content,
      word_count: turn.wordCount,
      character_count: turn.characterCount,
    } : null);

    showToast(`Restored Version ${turn.versionNumber} as active post!`, 'success');

    if (generatedContent?.id) {
      try {
        await apiClient.restoreContentVersion(generatedContent.id, turn.versionNumber);
      } catch (e) {
        console.error('Failed to sync restored version with backend:', e);
      }
    }
  };

  const copyToClipboard = (text: string, id: string = 'active') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Switch a multi-platform item into single chat refiner
  const handleOpenMultiInChat = (item: GeneratedContent) => {
    const plat = item.platform.toLowerCase() as 'linkedin' | 'instagram' | 'facebook' | 'twitter';
    setActivePlatform(plat);
    setGeneratedContent(item);
    const initialTurn: ChatTurn = {
      id: 'v1-' + Date.now(),
      role: 'assistant',
      content: item.body,
      versionNumber: 1,
      instruction: 'Initial Multi-Platform Generation',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wordCount: item.word_count,
      characterCount: item.character_count,
    };
    setChatTurns([initialTurn]);
    setActiveVersionNumber(1);
    showToast(`Loaded ${item.platform} into Chat Refiner`, 'info');
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Social Media Content Studio
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Generate platform-native content with hooks, carousel slide breakdowns, reels scripts, and Twitter threads.
            Refine iteratively via conversational chat — with full historical versions preserved and 1-click restore.
          </p>
        </div>

        {/* AI Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Engine:</span>
          <select
            value={chatProvider}
            onChange={(e) => setChatProvider(e.target.value as 'gemini' | 'openai' | 'claude')}
            style={{ fontSize: '0.82rem', fontWeight: 600, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: 'white' }}
          >
            <option value="gemini">Google Gemini 2.0</option>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="claude">Anthropic Claude 3.5</option>
          </select>
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
              <span>{loading ? `Generating with ${chatProvider.toUpperCase()}...` : activePlatform === 'multi' ? 'Generate 5 Platform Versions' : 'Generate Post'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Post Summary Card (When Generated) */}
      {generatedContent && activePlatform !== 'multi' && (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, marginBottom: 28, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{generatedContent.platform}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#ecfdf5', color: '#047857', padding: '3px 10px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                Active: Version {activeVersionNumber}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {generatedContent.word_count} words • {generatedContent.character_count} chars
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyToClipboard(generatedContent.body, 'active')} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                {copiedId === 'active' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copiedId === 'active' ? 'Copied' : 'Copy Active Post'}</span>
              </button>
              <Link
                href={`/quality?contentId=${generatedContent.id}`}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 14px', background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
              >
                <ShieldCheck size={14} />
                <span>Audit Quality</span>
              </Link>
            </div>
          </div>

          {/* Visual Concept Banner */}
          {generatedContent.metadata_json?.visual_concept && (
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.85rem', color: '#475569' }}>
              <strong>Visual Design Concept:</strong> {generatedContent.metadata_json.visual_concept}
            </div>
          )}

          {/* Active Post Body */}
          <div style={{
            background: '#f8fafc', padding: 22, borderRadius: 10, border: '1px solid #e2e8f0',
            whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.65, color: '#1e293b',
            fontFamily: activePlatform === 'twitter' ? 'monospace' : 'inherit'
          }}>
            {generatedContent.body}
          </div>

          {/* Slides Breakdown if Instagram Carousel */}
          {generatedContent.metadata_json?.slides && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                Carousel Slide-by-Slide Layout ({generatedContent.metadata_json.slides.length} Slides)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {generatedContent.metadata_json.slides.map((s: any, idx: number) => (
                  <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', marginBottom: 3 }}>Slide {s.slide_number || idx + 1}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: 4 }}>{s.headline}</div>
                    <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 6 }}>{s.body}</div>
                    {s.visual_note && <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Note: {s.visual_note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* CONVERSATIONAL CHAT & VERSION REVISION INTERFACE              */}
      {/* ============================================================ */}
      {generatedContent && activePlatform !== 'multi' && (
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 32,
        }}>
          {/* Chat Header Bar */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: 'white',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: '#38bdf8', color: '#0f172a', width: 32, height: 32,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>AI Revision Chat & Version History</span>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                    {chatTurns.filter(t => t.role === 'assistant').length} Versions Available
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Give instructions to modify this post. Previous versions are saved below and can be restored anytime.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Chat Engine:</span>
              <select
                value={chatProvider}
                onChange={(e) => setChatProvider(e.target.value as 'gemini' | 'openai' | 'claude')}
                style={{
                  fontSize: '0.78rem', fontWeight: 600, padding: '4px 8px',
                  borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer'
                }}
              >
                <option value="gemini" style={{ color: '#0f172a' }}>Google Gemini 2.0</option>
                <option value="openai" style={{ color: '#0f172a' }}>OpenAI GPT-4o</option>
                <option value="claude" style={{ color: '#0f172a' }}>Anthropic Claude 3.5</option>
              </select>
            </div>
          </div>

          {/* Chat Message Stream */}
          <div
            ref={chatContainerRef}
            style={{
              padding: 24,
              maxHeight: 650,
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}
          >
            {chatTurns.map((turn) => {
              const isAssistant = turn.role === 'assistant';
              const isActive = turn.versionNumber === activeVersionNumber;

              if (!isAssistant) {
                // User Instruction Speech Bubble
                return (
                  <div key={turn.id} style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <div style={{
                      maxWidth: '75%',
                      background: '#0284c7',
                      color: 'white',
                      padding: '12px 18px',
                      borderRadius: '16px 16px 2px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, opacity: 0.85, fontSize: '0.75rem', fontWeight: 600 }}>
                        <User size={13} />
                        <span>Your Instruction</span>
                        <span style={{ marginLeft: 'auto' }}>{turn.timestamp}</span>
                      </div>
                      <div>{turn.content}</div>
                    </div>
                  </div>
                );
              }

              // Assistant Generated Version Card
              return (
                <div key={turn.id} style={{ display: 'flex', justifyContent: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '92%',
                    background: 'white',
                    border: isActive ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: '16px 16px 16px 2px',
                    boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                    overflow: 'hidden'
                  }}>
                    {/* Card Header with Version Info & Restore Action */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      background: isActive ? '#f0f9ff' : '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          background: isActive ? '#0284c7' : '#64748b',
                          color: 'white',
                          borderRadius: 6,
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          v{turn.versionNumber}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          {turn.instruction ? `"${turn.instruction.slice(0, 50)}${turn.instruction.length > 50 ? '...' : ''}"` : 'Initial Generation'}
                        </span>
                        {isActive ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: '0.72rem', fontWeight: 700, background: '#dcfce7',
                            color: '#15803d', padding: '2px 8px', borderRadius: 12, border: '1px solid #86efac'
                          }}>
                            <CheckCircle size={12} /> Active Post
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.72rem', background: '#f1f5f9',
                            color: '#64748b', padding: '2px 8px', borderRadius: 12
                          }}>
                            Past Version
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {turn.wordCount} words • {turn.characterCount} chars
                        </span>

                        {/* Restore Button (Active if not currently active version) */}
                        {!isActive ? (
                          <button
                            onClick={() => handleRestoreVersion(turn)}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              background: '#f0fdf4',
                              color: '#15803d',
                              borderColor: '#bbf7d0',
                              fontWeight: 600
                            }}
                            title="Restore this version as the active post"
                          >
                            <RotateCcw size={12} />
                            <span>Restore this Version</span>
                          </button>
                        ) : null}

                        {/* Copy Version */}
                        <button
                          onClick={() => copyToClipboard(turn.content, turn.id)}
                          className="btn-ghost"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          title="Copy this version's text"
                        >
                          {copiedId === turn.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                          <span>{copiedId === turn.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Version Content Body */}
                    <div style={{
                      padding: '16px 20px',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.92rem',
                      lineHeight: 1.6,
                      color: '#1e293b',
                      fontFamily: activePlatform === 'twitter' ? 'monospace' : 'inherit'
                    }}>
                      {turn.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Thinking / Refining Indicator */}
            {refining && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', width: 'fit-content' }}>
                <RefreshCw size={16} className="spin" color="#0284c7" />
                <span style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 600 }}>
                  Refining {activePlatform.toUpperCase()} post according to instructions...
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Instruction Pills */}
          <div style={{
            padding: '12px 20px 8px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', alignSelf: 'center', marginRight: 4 }}>
              Quick Refinements:
            </span>
            {QUICK_INSTRUCTION_PILLS.map((pill, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendInstruction(pill.text)}
                disabled={refining}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e0f2fe';
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.color = '#0284c7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div style={{
            padding: '12px 20px 16px',
            background: '#ffffff',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end'
          }}>
            <textarea
              rows={2}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendInstruction();
                }
              }}
              placeholder={`Give instructions to refine this ${activePlatform.toUpperCase()} post (e.g. 'Make it punchier with 3 bullets', 'Add an engaging question', 'Shorten for mobile')... Press Enter to send`}
              style={{
                flex: 1,
                fontSize: '0.9rem',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                resize: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.4
              }}
              disabled={refining}
            />

            <button
              onClick={() => handleSendInstruction()}
              disabled={refining || !chatInput.trim()}
              className="btn-primary"
              style={{
                height: 48,
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: refining || !chatInput.trim() ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                borderColor: '#0284c7'
              }}
            >
              {refining ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
              <span>{refining ? 'Refining...' : 'Refine'}</span>
            </button>
          </div>

          <div style={{
            padding: '4px 20px 10px',
            fontSize: '0.72rem',
            color: '#64748b',
            background: '#ffffff'
          }}>
            💡 <strong>Chatbot Versioning:</strong> Every instruction generates a new version below without overwriting. Click <strong>"Restore this Version"</strong> on any previous card to restore it as the active post.
          </div>
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f1f5f9', gap: 8 }}>
                  <button onClick={() => copyToClipboard(item.body, item.id)} className="btn-ghost" style={{ fontSize: '0.75rem' }}>
                    {copiedId === item.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpenMultiInChat(item)}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#f0f9ff', color: '#0284c7', borderColor: '#bae6fd' }}
                    >
                      <MessageSquare size={13} />
                      <span>Refine in Chat</span>
                    </button>
                    <Link href={`/writer?id=${item.id}`} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      Editor
                    </Link>
                  </div>
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
