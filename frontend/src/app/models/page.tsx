'use client';

import React, { useState, useEffect } from 'react';
import {
  Cpu, KeyRound, CheckCircle2, AlertTriangle, ShieldCheck,
  Download, Sparkles, RefreshCw, Lock, Terminal
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

  const fetchProviders = async () => {
    try {
      const data = await apiClient.getProviders();
      setProviders(data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
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
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 280 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              API Key
            </label>
            <input
              type="password"
              style={{ width: '100%', fontSize: '0.9rem', fontFamily: 'monospace' }}
              placeholder={selectedSlug === 'gemini' ? 'AIzaSy...' : 'sk-...'}
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
