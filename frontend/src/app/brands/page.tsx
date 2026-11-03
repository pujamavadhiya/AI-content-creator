'use client';

import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, Check, Globe, Users, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { Brand } from '@/types';

export default function BrandsPage() {
  const { brands, activeBrand, setActiveBrand, refreshBrands, showToast } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [brandVoice, setBrandVoice] = useState('Professional & Authoritative');
  const [writingTone, setWritingTone] = useState('Thought leadership');
  const [ctaStyle, setCtaStyle] = useState('Start your free trial');
  const [customInstructions, setCustomInstructions] = useState('');
  const [restrictedWords, setRestrictedWords] = useState('synergy, paradigm shift');
  const [preferredKeywords, setPreferredKeywords] = useState('AI content, enterprise RAG');
  const [competitors, setCompetitors] = useState('');
  const [saving, setSaving] = useState(false);

  const writingTones = [
    'Professional', 'Conversational', 'Educational', 'Persuasive',
    'Informative', 'Friendly', 'Formal', 'Casual', 'Technical', 'Thought leadership'
  ];

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName('');
    setCompanyName('');
    setIndustry('');
    setWebsiteUrl('');
    setTargetAudience('');
    setTargetMarket('');
    setBrandVoice('Professional & Authoritative');
    setWritingTone('Thought leadership');
    setCtaStyle('Start your free trial');
    setCustomInstructions('');
    setRestrictedWords('');
    setPreferredKeywords('');
    setCompetitors('');
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setCompanyName(b.company_name || '');
    setIndustry(b.industry);
    setWebsiteUrl(b.website_url || '');
    setTargetAudience(b.target_audience || '');
    setTargetMarket(b.target_geographical_market || '');
    setBrandVoice(b.brand_voice);
    setWritingTone(b.writing_tone);
    setCtaStyle(b.preferred_cta_style);
    setCustomInstructions(b.custom_instructions || '');
    setRestrictedWords(b.guidelines?.restricted_words.join(', ') || '');
    setPreferredKeywords(b.guidelines?.preferred_keywords.join(', ') || '');
    setCompetitors(b.guidelines?.competitors.join(', ') || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !industry) {
      showToast('Brand name and industry are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name,
        company_name: companyName,
        industry,
        website_url: websiteUrl,
        target_audience: targetAudience,
        target_geographical_market: targetMarket,
        brand_voice: brandVoice,
        writing_tone: writingTone,
        preferred_cta_style: ctaStyle,
        custom_instructions: customInstructions,
        guidelines: {
          restricted_words: restrictedWords.split(',').map((w) => w.trim()).filter(Boolean),
          preferred_keywords: preferredKeywords.split(',').map((w) => w.trim()).filter(Boolean),
          competitors: competitors.split(',').map((w) => w.trim()).filter(Boolean),
          products_services: []
        }
      };

      if (editingBrand) {
        await apiClient.updateBrand(editingBrand.id, payload);
        showToast('Brand profile updated successfully', 'success');
      } else {
        await apiClient.createBrand(payload);
        showToast('Brand profile created successfully', 'success');
      }
      await refreshBrands();
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to save brand', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this brand profile?')) {
      try {
        await apiClient.deleteBrand(id);
        showToast('Brand profile deleted', 'info');
        await refreshBrands();
      } catch (err: any) {
        showToast('Failed to delete brand', 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Brand Profiles
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Configure your brand voice, tone guidelines, and restricted keywords. The active brand automatically guides all RAG research, keyword generation, and content studio outputs.
          </p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={16} />
          <span>Create Brand Profile</span>
        </button>
      </div>

      {brands.length === 0 ? (
        <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 48, textAlign: 'center' }}>
          <Building2 size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>No Brand Profiles Yet</h3>
          <p style={{ color: '#64748b', maxWidth: 440, margin: '8px auto 20px', fontSize: '0.9rem' }}>
            Create your first brand profile to infuse your company's tone, audience criteria, and guidelines into every piece of generated content.
          </p>
          <button onClick={handleOpenCreate} className="btn-primary">
            <Plus size={16} />
            <span>Create First Brand Profile</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {brands.map((b) => {
            const isActive = activeBrand?.id === b.id;
            return (
              <div
                key={b.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  border: isActive ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  padding: 24,
                  boxShadow: isActive ? '0 10px 15px -3px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: -11, right: 16,
                    background: '#6366f1', color: 'white', fontSize: '0.7rem',
                    fontWeight: 700, padding: '2px 8px', borderRadius: 9999,
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Active Profile
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 700, fontSize: '1.2rem' }}>
                    {b.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{b.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.industry}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  <span className="badge badge-primary">{b.writing_tone}</span>
                  <span className="badge badge-neutral">{b.brand_voice}</span>
                  {b.target_geographical_market && <span className="badge badge-neutral">{b.target_geographical_market}</span>}
                </div>

                {b.target_audience && (
                  <div style={{ fontSize: '0.825rem', color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <Users size={14} style={{ flexShrink: 0, marginTop: 2, color: '#64748b' }} />
                    <span>Audience: {b.target_audience}</span>
                  </div>
                )}

                {b.guidelines?.restricted_words && b.guidelines.restricted_words.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <ShieldAlert size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Restricted: {b.guidelines.restricted_words.join(', ')}</span>
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {!isActive ? (
                    <button
                      onClick={() => { setActiveBrand(b); showToast(`Activated ${b.name}`, 'success'); }}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      <Check size={14} />
                      <span>Set as Active</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>Active in Workflows</span>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleOpenEdit(b)} className="btn-ghost" title="Edit Brand">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="btn-ghost" style={{ color: '#ef4444' }} title="Delete Brand">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999, padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 680,
            maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>
              {editingBrand ? 'Edit Brand Profile' : 'Create Brand Profile'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 24 }}>
              Set communication style, voice, and guardrails to personalize AI outputs.
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Brand Name *</label>
                  <input
                    style={{ width: '100%' }}
                    placeholder="e.g. Sevencore AI"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Industry *</label>
                  <input
                    style={{ width: '100%' }}
                    placeholder="e.g. Artificial Intelligence, SaaS"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Company Legal Name</label>
                  <input
                    style={{ width: '100%' }}
                    placeholder="e.g. Sevencore Technologies Inc"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Website URL</label>
                  <input
                    style={{ width: '100%' }}
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Writing Tone</label>
                  <select
                    style={{ width: '100%' }}
                    value={writingTone}
                    onChange={(e) => setWritingTone(e.target.value)}
                  >
                    {writingTones.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Brand Voice</label>
                  <input
                    style={{ width: '100%' }}
                    placeholder="e.g. Authoritative, Strategic, Clear"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Target Audience</label>
                <input
                  style={{ width: '100%' }}
                  placeholder="e.g. Chief Marketing Officers, Content Strategists"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Preferred CTA Style</label>
                <input
                  style={{ width: '100%' }}
                  placeholder="e.g. Schedule a private architectural demo"
                  value={ctaStyle}
                  onChange={(e) => setCtaStyle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6, color: '#ef4444' }}>
                  Restricted Words & Phrases (comma separated)
                </label>
                <input
                  style={{ width: '100%' }}
                  placeholder="synergy, game changer, delve, revolutionized"
                  value={restrictedWords}
                  onChange={(e) => setRestrictedWords(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>
                  Preferred Keywords to Weave In (comma separated)
                </label>
                <input
                  style={{ width: '100%' }}
                  placeholder="content intelligence, vector search, RAG"
                  value={preferredKeywords}
                  onChange={(e) => setPreferredKeywords(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Custom Brand Instructions</label>
                <textarea
                  style={{ width: '100%', minHeight: 70 }}
                  placeholder="e.g. Always emphasize latency benchmarks and zero-hallucination compliance."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving Profile...' : editingBrand ? 'Save Changes' : 'Create Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

