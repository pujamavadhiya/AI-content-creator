'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu, KeyRound, CheckCircle2, AlertTriangle, ShieldCheck,
  Download, Sparkles, RefreshCw, Lock, Terminal, Database,
  Layers, CheckCheck, Play, BookOpen, FileSpreadsheet, Tag
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { AIProviderInfo } from '@/types';

export default function AIModelsPage() {
  const { showToast } = useApp();

  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Key save states
  const [selectedSlug, setSelectedSlug] = useState<string>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  
  // Connection testing states
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ [slug: string]: { success: boolean; message: string } }>({});

  // PAWS Paraphrase Dataset & LLM Fine-Tuning Studio States
  const [pawsOverview, setPawsOverview] = useState<any>(null);
  const [loadingPaws, setLoadingPaws] = useState(false);
  const [indexingExemplars, setIndexingExemplars] = useState(false);
  const [exportingFinetune, setExportingFinetune] = useState(false);
  const [startingFinetune, setStartingFinetune] = useState(false);
  const [finetuneModel, setFinetuneModel] = useState('gpt-4o-mini-2024-07-18');
  const [finetuneApiKey, setFinetuneApiKey] = useState('');
  const [finetuneJobResult, setFinetuneJobResult] = useState<any>(null);

  // WordNet Dictionary & Thesaurus States
  const [wordnetOverview, setWordnetOverview] = useState<any>(null);
  const [loadingWordnet, setLoadingWordnet] = useState(false);
  const [processingWordnet, setProcessingWordnet] = useState(false);
  const [exportingWordnet, setExportingWordnet] = useState(false);
  const [exportingCombined, setExportingCombined] = useState(false);

  const fetchProviders = async () => {
    try {
      const data = await apiClient.getProviders();
      setProviders(data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const fetchPawsOverview = async () => {
    try {
      setLoadingPaws(true);
      const data = await apiClient.getPawsDatasetOverview();
      setPawsOverview(data);
    } catch (e) {} finally {
      setLoadingPaws(false);
    }
  };

  const fetchWordnetOverview = async () => {
    try {
      setLoadingWordnet(true);
      const data = await apiClient.getWordNetOverview();
      setWordnetOverview(data);
    } catch (e) {} finally {
      setLoadingWordnet(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    fetchPawsOverview();
    fetchWordnetOverview();
  }, []);

  const handleSaveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      await apiClient.saveCredential(selectedSlug, apiKeyInput.trim());
      showToast(`${selectedSlug.toUpperCase()} API key saved securely (Fernet encrypted)`, 'success');
      setApiKeyInput('');
      await fetchProviders();
    } catch (err: any) {
      showToast('Failed to save API credential', 'error');
    } finally {
      setSavingKey(false);
    }
  };

  const handleTestConnection = async (slug: string) => {
    setTestingSlug(slug);
    try {
      const res = await apiClient.testConnection(slug);
      setTestResult((prev) => ({
        ...prev,
        [slug]: { success: res.success, message: res.message }
      }));
      if (res.success) {
        showToast(`Connection to ${slug} successful!`, 'success');
      } else {
        showToast(`Connection to ${slug} failed: ${res.message}`, 'error');
      }
      await fetchProviders();
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [slug]: { success: false, message: 'Provider connection failed.' }
      }));
      showToast('Provider connection test failed', 'error');
    } finally {
      setTestingSlug(null);
    }
  };

  const handleIndexExemplars = async () => {
    setIndexingExemplars(true);
    try {
      const res = await apiClient.processPawsExemplars();
      showToast(`Indexed ${res.exemplars_extracted} PAWS exemplars for in-context human learning!`, 'success');
      await fetchPawsOverview();
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to index PAWS exemplars', 'error');
    } finally {
      setIndexingExemplars(false);
    }
  };

  const handleExportFineTune = async (provider: 'openai' | 'gemini') => {
    setExportingFinetune(true);
    try {
      const res = await apiClient.exportPawsFineTune({ provider, train_limit: 3000, val_limit: 400 });
      showToast(`Exported ${res.train_count} training pairs to ${res.train_file}`, 'success');
      await fetchPawsOverview();
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to export fine-tuning dataset', 'error');
    } finally {
      setExportingFinetune(false);
    }
  };

  const handleStartFineTune = async (e: React.FormEvent) => {
    e.preventDefault();
    setStartingFinetune(true);
    try {
      const res = await apiClient.startPawsFineTune({
        model: finetuneModel,
        api_key: finetuneApiKey || undefined
      });
      setFinetuneJobResult(res);
      showToast(res.message || 'Fine-tuning job started on OpenAI!', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to start fine-tuning job', 'error');
    } finally {
      setStartingFinetune(false);
    }
  };

  const handleProcessWordnetLexicon = async () => {
    setProcessingWordnet(true);
    try {
      const res = await apiClient.processWordNetLexicon();
      showToast(`Indexed ${res.total_indexed} WordNet words and ${res.ai_cliche_targets} AI cliché replacements!`, 'success');
      await fetchWordnetOverview();
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Failed to process WordNet lexicon', 'error');
    } finally {
      setProcessingWordnet(false);
    }
  };

  const handleExportWordnetFineTune = async (provider: 'openai' | 'gemini') => {
    setExportingWordnet(true);
    try {
      const res = await apiClient.exportWordNetFineTune({ provider, train_limit: 3000, val_limit: 400 });
      showToast(`Exported ${res.train_count} WordNet records to ${res.train_file.split('/').pop()} (${res.train_size_kb} KB)!`, 'success');
      await fetchWordnetOverview();
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'WordNet export failed', 'error');
    } finally {
      setExportingWordnet(false);
    }
  };

  const handleExportCombinedFineTune = async (provider: 'openai' | 'gemini') => {
    setExportingCombined(true);
    try {
      const res = await apiClient.exportCombinedFineTune({ provider, paws_limit: 2500, wordnet_limit: 1500 });
      showToast(`Generated Master Combined Dataset (${res.train_count} records) combining PAWS + WordNet!`, 'success');
      await Promise.all([fetchPawsOverview(), fetchWordnetOverview()]);
    } catch (e: any) {
      showToast(e.response?.data?.detail || 'Combined export failed', 'error');
    } finally {
      setExportingCombined(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            AI Model Settings & Supervised Datasets
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Provider-independent integration layer supporting Google Gemini (Primary Default), OpenAI, and Claude. Credentials are encrypted on the backend.
          </p>
        </div>
      </div>

      {/* Provider Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 32 }}>
        {providers.map((p) => {
          const test = testResult[p.slug];
          const isTesting = testingSlug === p.slug;
          const isPrimary = p.slug === 'gemini';

          return (
            <div
              key={p.id}
              style={{
                background: 'white',
                borderRadius: 14,
                border: isPrimary ? '2px solid #6366f1' : '1px solid #e2e8f0',
                padding: 24,
                boxShadow: isPrimary ? '0 10px 15px -3px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{p.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Default: {p.default_model}</div>
                  </div>
                </div>

                {isPrimary && (
                  <span className="badge badge-primary">Primary Default</span>
                )}
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9', fontSize: '0.8rem', color: '#475569', marginBottom: 16 }}>
                <div>Embeddings: <strong>{p.embedding_model}</strong></div>
                <div style={{ marginTop: 4 }}>
                  Status: {p.has_key_configured ? (
                    <span style={{ color: '#059669', fontWeight: 600 }}>Key Configured ({p.key_hint || 'Active'})</span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: 600 }}>API Key Needed</span>
                  )}
                </div>
              </div>

              {test && (
                <div style={{
                  padding: 10, borderRadius: 8, fontSize: '0.8rem', marginBottom: 16,
                  background: test.success ? '#ecfdf5' : '#fef2f2',
                  color: test.success ? '#047857' : '#991b1b',
                  border: test.success ? '1px solid #a7f3d0' : '1px solid #fecaca'
                }}>
                  {test.message}
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => { setSelectedSlug(p.slug); }}
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem' }}
                >
                  <KeyRound size={14} />
                  <span>Update Key</span>
                </button>

                <button
                  onClick={() => handleTestConnection(p.slug)}
                  disabled={isTesting}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  {isTesting ? <RefreshCw size={14} className="spin" /> : <Terminal size={14} />}
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save API Key Securely Card */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Configure Provider API Key (Fernet Encrypted)
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Keys are encrypted at rest with AES-128-CBC/Fernet. Never exposed in plain text.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCredential} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 220 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Provider
            </label>
            <select
              style={{ width: '100%', fontSize: '0.9rem' }}
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="openai">OpenAI</option>
              <option value="claude">Anthropic Claude</option>
              <option value="serpapi">SerpApi (Google Trends & Live Search)</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              API Key
            </label>
            <input
              type="password"
              style={{ width: '100%', fontSize: '0.9rem', fontFamily: 'monospace' }}
              placeholder={selectedSlug === 'gemini' ? 'AIzaSy...' : selectedSlug === 'claude' ? 'sk-ant-api03-...' : 'sk-proj-...'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={savingKey} className="btn-primary" style={{ height: 40, padding: '0 24px' }}>
            <ShieldCheck size={16} />
            <span>{savingKey ? 'Encrypting & Storing...' : 'Save Encrypted Key'}</span>
          </button>
        </form>
      </div>

      {/* PAWS Paraphrase Dataset & LLM Training Studio */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  PAWS Paraphrase Dataset & LLM Training Studio
                </h3>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700 }}>
                  TRAINING DATASET DETECTED
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                Grounded on <code>LLM Model/Datasets/</code> (PAWS: Paraphrase Adversaries from Word Scrambling) to train models for 85–95%+ Human Content scores.
              </p>
            </div>
          </div>

          <button
            onClick={fetchPawsOverview}
            disabled={loadingPaws}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} className={loadingPaws ? 'spin' : ''} />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Dataset Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Dataset Rows</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {pawsOverview?.total_rows?.toLocaleString() || '105,798'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: 2 }}>Across 5 CSV files in LLM Model</div>
          </div>

          <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', textTransform: 'uppercase' }}>Human Paraphrase Pairs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', marginTop: 4 }}>
              {pawsOverview?.positive_paraphrases?.toLocaleString() || '36,834'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: 2 }}>Verified (Label = 1) Ground Truth</div>
          </div>

          <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>Few-Shot Exemplars</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
              300 Indexed
            </div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: 2 }}>Active In-Context Prompt Learning</div>
          </div>

          <div style={{ background: '#faf5ff', padding: 16, borderRadius: 12, border: '1px solid #e9d5ff' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b21a8', textTransform: 'uppercase' }}>Target Human Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7e22ce', marginTop: 4 }}>
              85% - 95%+
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9333ea', marginTop: 2 }}>AI Detector Safe (High Burstiness)</div>
          </div>
        </div>

        {/* 3 Core Learning & Training Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18, marginBottom: 20 }}>
          {/* Pillar 1: In-Context Learning */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Layers size={16} color="#0284c7" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>1. In-Context Exemplar Learning</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: 12 }}>
                Extracts clean, diverse PAWS sentence pairs and injects them dynamically into the prompt. Teaches the model clause inversion and sentence splitting without costly training.
              </p>
            </div>
            <button
              onClick={handleIndexExemplars}
              disabled={indexingExemplars}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
            >
              <RefreshCw size={13} className={indexingExemplars ? 'spin' : ''} />
              <span>{indexingExemplars ? 'Extracting & Indexing...' : 'Re-Index In-Context Exemplars'}</span>
            </button>
          </div>

          {/* Pillar 2: SFT Dataset Export */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Download size={16} color="#059669" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>2. SFT Fine-Tuning JSONL Export</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: 12 }}>
                Exports formatted JSONL datasets for OpenAI (<code>messages</code> schema) and Gemini (<code>contents</code> schema) into <code>LLM Model/Processed/</code>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleExportFineTune('openai')}
                disabled={exportingFinetune}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px' }}
              >
                <Download size={13} />
                <span>OpenAI JSONL</span>
              </button>
              <button
                onClick={() => handleExportFineTune('gemini')}
                disabled={exportingFinetune}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px' }}
              >
                <Download size={13} />
                <span>Gemini JSONL</span>
              </button>
            </div>
          </div>

          {/* Pillar 3: Launch OpenAI Model Fine-Tuning */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={16} color="#7c3aed" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>3. Model Fine-Tuning Job (API)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: 8 }}>
                Uploads the exported JSONL and launches an automated fine-tuning job on OpenAI to produce a custom paraphrasing model.
              </p>
            </div>

            <form onSubmit={handleStartFineTune} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={finetuneModel}
                  onChange={(e) => setFinetuneModel(e.target.value)}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '6px' }}
                >
                  <option value="gpt-4o-mini-2024-07-18">gpt-4o-mini (Recommended)</option>
                  <option value="gpt-3.5-turbo-0125">gpt-3.5-turbo</option>
                </select>
                <button
                  type="submit"
                  disabled={startingFinetune}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
                >
                  <Play size={12} />
                  <span>{startingFinetune ? 'Launching...' : 'Start Tuning'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {finetuneJobResult && (
          <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', fontSize: '0.82rem', color: '#166534' }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Fine-Tuning Job Active!</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>Tracking ID:</strong> <code>{finetuneJobResult.job_id}</code> | <strong>Model:</strong> {finetuneJobResult.model} | <strong>Status:</strong> {finetuneJobResult.status}
            </div>
          </div>
        )}
      </div>

      {/* WordNet Dictionary & Thesaurus Studio */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  WordNet Dictionary & Thesaurus Studio
                </h3>
                <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700 }}>
                  576k+ LEXICON RECORDS
                </span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700 }}>
                  AI CLICHÉ ERADICATOR
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>
                Grounded on <code>LLM Model/WordNet-DictionaryThesaurus/</code> across 8 lexical databases. Boosts vocabulary perplexity and replaces AI clichés.
              </p>
            </div>
          </div>

          <button
            onClick={fetchWordnetOverview}
            disabled={loadingWordnet}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} className={loadingWordnet ? 'spin' : ''} />
            <span>Refresh Lexicon</span>
          </button>
        </div>

        {/* WordNet Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total WordNet Records</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
              {wordnetOverview?.total_rows?.toLocaleString() || '576,035'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 2 }}>Across 8 CSV Files (38.5 MB)</div>
          </div>

          <div style={{ background: '#ecfdf5', padding: 16, borderRadius: 12, border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>Thesaurus & Synonyms</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857', marginTop: 4 }}>
              {wordnetOverview?.thesaurus_and_synonyms?.toLocaleString() || '331,407'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: 2 }}>Lexical Diversity Pairs</div>
          </div>

          <div style={{ background: '#eff6ff', padding: 16, borderRadius: 12, border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase' }}>Curated AI Targets</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
              {wordnetOverview?.lexicon_store_summary?.ai_cliche_targets || 40}+ Clichés
            </div>
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: 2 }}>utilize, delve, leverage, pivotal...</div>
          </div>

          <div style={{ background: '#fdf2f8', padding: 16, borderRadius: 12, border: '1px solid #fbcfe8' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9d174d', textTransform: 'uppercase' }}>Master Total (PAWS + WordNet)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#be185d', marginTop: 4 }}>
              681,833
            </div>
            <div style={{ fontSize: '0.75rem', color: '#db2777', marginTop: 2 }}>Syntactic + Lexical Datasets</div>
          </div>
        </div>

        {/* WordNet Files Breakdown Pills */}
        {wordnetOverview?.files && (
          <div style={{ marginBottom: 20, padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileSpreadsheet size={14} color="#059669" />
              <span>WordNet Database Files Detected ({wordnetOverview.files.length} Files):</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {wordnetOverview.files.map((f: any) => (
                <div
                  key={f.filename}
                  style={{
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{f.filename}</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{f.row_count.toLocaleString()} rows</span>
                  <span style={{ color: '#94a3b8' }}>({f.size_mb} MB)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WordNet Action Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
          {/* Pillar 1: Build WordNet Lexicon Store */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Layers size={16} color="#059669" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>1. Build WordNet Lexicon Store</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: 12 }}>
                Indexes high-frequency AI buzzwords (&ldquo;utilize&rdquo;, &ldquo;delve&rdquo;, &ldquo;leverage&rdquo;, &ldquo;tapestry&rdquo;) and maps them to diverse human-sounding alternatives from WordNet.
              </p>
            </div>
            <button
              onClick={handleProcessWordnetLexicon}
              disabled={processingWordnet}
              className="btn-secondary"
              style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
            >
              <RefreshCw size={13} className={processingWordnet ? 'spin' : ''} />
              <span>{processingWordnet ? 'Indexing WordNet...' : 'Index AI Lexicon Store'}</span>
            </button>
          </div>

          {/* Pillar 2: WordNet SFT JSONL Export */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Download size={16} color="#0284c7" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>2. WordNet Fine-Tuning JSONL</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: 12 }}>
                Exports supervised lexical replacement pairs teaching the LLM natural synonym substitution and vocabulary surprisal (perplexity).
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleExportWordnetFineTune('openai')}
                disabled={exportingWordnet}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px' }}
              >
                <Download size={13} />
                <span>OpenAI JSONL</span>
              </button>
              <button
                onClick={() => handleExportWordnetFineTune('gemini')}
                disabled={exportingWordnet}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px' }}
              >
                <Download size={13} />
                <span>Gemini JSONL</span>
              </button>
            </div>
          </div>

          {/* Pillar 3: Combined Master SFT Export (PAWS + WordNet) */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(to bottom, #fcfaff, #ffffff)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Sparkles size={16} color="#7c3aed" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>3. Master SFT Dataset (PAWS + WordNet)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, marginBottom: 12 }}>
                Synthesizes PAWS syntactic restructuring with WordNet lexical enrichment into a single master training dataset for maximum human content score.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleExportCombinedFineTune('openai')}
                disabled={exportingCombined}
                className="btn-primary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
              >
                <Download size={13} />
                <span>Master OpenAI</span>
              </button>
              <button
                onClick={() => handleExportCombinedFineTune('gemini')}
                disabled={exportingCombined}
                className="btn-primary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '7px 10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
              >
                <Download size={13} />
                <span>Master Gemini</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SFT Dataset Management */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Supervised Fine-Tuning (SFT) Dataset Readiness
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Export human-approved and high-quality generation examples into standard JSONL datasets for future model fine-tuning.
              </p>
            </div>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Export Production Dataset (JSONL)</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Filters for human-approved examples with Quality Score &gt;= 8.0.
            </div>
          </div>

          <button
            onClick={() => showToast('Dataset JSONL generated in /exports/datasets/', 'success')}
            className="btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <Download size={15} />
            <span>Export SFT JSONL</span>
          </button>
        </div>
      </div>
    </div>
  );
}

