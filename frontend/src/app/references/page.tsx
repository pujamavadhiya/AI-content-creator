'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen, FolderPlus, UploadCloud, Globe, FileText,
  Search, Eye, Trash2, CheckCircle2, Clock, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { ReferenceCollection, ReferenceDocument, ReferenceAnalysis } from '@/types';

export default function ReferencesPage() {
  const { activeBrand, collections, activeCollection, setActiveCollection, refreshCollections, showToast } = useApp();

  const [documents, setDocuments] = useState<ReferenceDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Modals
  const [createColModal, setCreateColModal] = useState(false);
  const [colName, setColName] = useState('');
  const [colDesc, setColDesc] = useState('');
  
  const [ingestModal, setIngestModal] = useState(false);
  const [ingestType, setIngestType] = useState<'upload' | 'url' | 'text'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Analysis Viewer Modal
  const [viewingDoc, setViewingDoc] = useState<ReferenceDocument | null>(null);

  const fetchDocuments = async () => {
    if (!activeCollection) return;
    setLoadingDocs(true);
    try {
      const data = await apiClient.getDocuments(activeCollection.id);
      setDocuments(data);
    } catch (e) {
      // silent
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeCollection]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName) return;
    try {
      const newCol = await apiClient.createCollection({
        name: colName,
        description: colDesc,
        brand_id: activeBrand?.id
      });
      showToast('Collection created', 'success');
      setColName('');
      setColDesc('');
      setCreateColModal(false);
      await refreshCollections();
      setActiveCollection(newCol);
    } catch (err: any) {
      showToast('Failed to create collection', 'error');
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollection) {
      showToast('Please select or create a collection first', 'error');
      return;
    }
    setIngesting(true);
    try {
      if (ingestType === 'upload') {
        if (!selectedFile) {
          showToast('Please select a file', 'error');
          setIngesting(false);
          return;
        }
        await apiClient.uploadDocument(activeCollection.id, selectedFile);
        showToast('Document uploaded and indexing started in Qdrant', 'success');
      } else if (ingestType === 'url') {
        if (!urlInput) {
          showToast('Please enter a URL', 'error');
          setIngesting(false);
          return;
        }
        await apiClient.ingestUrl(activeCollection.id, urlInput, urlTitle || undefined);
        showToast('URL submitted for ingestion and semantic analysis', 'success');
      } else if (ingestType === 'text') {
        if (!textTitle || !textContent) {
          showToast('Please enter title and content', 'error');
          setIngesting(false);
          return;
        }
        await apiClient.ingestText(activeCollection.id, textTitle, textContent);
        showToast('Manual text indexed in reference knowledge base', 'success');
      }
      setIngestModal(false);
      setSelectedFile(null);
      setUrlInput('');
      setTextTitle('');
      setTextContent('');
      await fetchDocuments();
      await refreshCollections();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to ingest reference material', 'error');
    } finally {
      setIngesting(false);
    }
  };

  const handleViewAnalysis = async (docId: string) => {
    try {
      const fullDoc = await apiClient.getDocument(docId);
      setViewingDoc(fullDoc);
    } catch (err) {
      showToast('Failed to load document analysis', 'error');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Delete this document and all its Qdrant vector embeddings?')) {
      try {
        await apiClient.deleteDocument(id);
        showToast('Document deleted', 'info');
        await fetchDocuments();
        await refreshCollections();
      } catch (err) {
        showToast('Failed to delete document', 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Reference Library & RAG Ingestion
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Upload PDFs, Word docs, spreadsheets, or web articles. The system semantically chunks the text, embeds it into Qdrant, and runs an automated intelligence analysis.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setCreateColModal(true)} className="btn-secondary">
            <FolderPlus size={16} />
            <span>New Collection</span>
          </button>
          <button onClick={() => setIngestModal(true)} className="btn-primary">
            <UploadCloud size={16} />
            <span>Ingest Knowledge</span>
          </button>
        </div>
      </div>

      {/* Collections Tabs */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, marginBottom: 24 }}>
        {collections.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '10px 0' }}>
            No collections created yet. Click "New Collection" to organize your materials.
          </div>
        ) : (
          collections.map((col) => {
            const isSelected = activeCollection?.id === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setActiveCollection(col)}
                style={{
                  background: isSelected ? '#1e1b4b' : 'white',
                  color: isSelected ? 'white' : '#475569',
                  border: isSelected ? '1px solid #1e1b4b' : '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <BookOpen size={16} color={isSelected ? '#a5b4fc' : '#64748b'} />
                <span>{col.name}</span>
                <span style={{
                  background: isSelected ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color: isSelected ? 'white' : '#64748b',
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: 9999
                }}>
                  {col.reference_count}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Documents List */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              {activeCollection ? activeCollection.name : 'Documents'}
            </h2>
            {activeCollection?.description && (
              <p style={{ fontSize: '0.825rem', color: '#64748b', marginTop: 2 }}>{activeCollection.description}</p>
            )}
          </div>
          <button onClick={fetchDocuments} className="btn-ghost" title="Refresh list">
            <RefreshCw size={15} />
          </button>
        </div>

        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
            <BookOpen size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>No Documents in this Collection</h4>
            <p style={{ fontSize: '0.85rem', maxWidth: 360, margin: '6px auto 16px' }}>
              Upload PDFs, Word docs, spreadsheets, or URLs to empower AI RAG with ground truth facts.
            </p>
            <button onClick={() => setIngestModal(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <UploadCloud size={15} />
              <span>Ingest Document Now</span>
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Document Name</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Word Count</th>
                <th style={{ padding: '12px 16px' }}>Qdrant Chunks</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} color="#6366f1" />
                      <span>{d.filename}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>{d.file_type}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>{d.word_count.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>{d.chunk_count} vectors</td>
                  <td style={{ padding: '14px 16px' }}>
                    {d.status === 'completed' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} />
                        <span>Ready (RAG)</span>
                      </span>
                    ) : d.status === 'processing' ? (
                      <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>Indexing...</span>
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} />
                        <span>{d.status}</span>
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleViewAnalysis(d.id)}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', marginRight: 6 }}
                    >
                      <Eye size={13} />
                      <span>View Intelligence</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(d.id)}
                      className="btn-ghost"
                      style={{ color: '#ef4444' }}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Collection Modal */}
      {createColModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999, padding: 20
        }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>
              Create Reference Collection
            </h3>
            <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Collection Name *</label>
                <input
                  style={{ width: '100%' }}
                  placeholder="e.g. AI Technical Research, Competitor Analysis"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
                <textarea
                  style={{ width: '100%', minHeight: 70 }}
                  placeholder="Notes about materials stored in this collection..."
                  value={colDesc}
                  onChange={(e) => setColDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setCreateColModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Collection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ingest Knowledge Modal */}
      {ingestModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999, padding: 20
        }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 580, padding: 32 }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, color: '#0f172a' }}>
              Ingest Reference Knowledge
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
              Collection: <strong>{activeCollection?.name}</strong>
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <button
                type="button"
                onClick={() => setIngestType('upload')}
                className={`btn-${ingestType === 'upload' ? 'primary' : 'secondary'}`}
                style={{ fontSize: '0.8rem' }}
              >
                <UploadCloud size={15} />
                <span>Upload Document</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestType('url')}
                className={`btn-${ingestType === 'url' ? 'primary' : 'secondary'}`}
                style={{ fontSize: '0.8rem' }}
              >
                <Globe size={15} />
                <span>Web URL</span>
              </button>
              <button
                type="button"
                onClick={() => setIngestType('text')}
                className={`btn-${ingestType === 'text' ? 'primary' : 'secondary'}`}
                style={{ fontSize: '0.8rem' }}
              >
                <FileText size={15} />
                <span>Manual Text</span>
              </button>
            </div>

            <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ingestType === 'upload' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8 }}>
                    Select File (PDF, DOCX, TXT, Markdown, Excel)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.xlsx,.xls"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    style={{ width: '100%', padding: '10px' }}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                    Max file size 25MB. Text will be cleaned, semantically chunked, and stored in Qdrant.
                  </div>
                </div>
              )}

              {ingestType === 'url' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Web Page / Article URL *</label>
                    <input
                      type="url"
                      style={{ width: '100%' }}
                      placeholder="https://example.com/blog/ai-future"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Optional Custom Title</label>
                    <input
                      style={{ width: '100%' }}
                      placeholder="e.g. Industry Report Summary"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                    />
                  </div>
                </>
              )}

              {ingestType === 'text' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Title *</label>
                    <input
                      style={{ width: '100%' }}
                      placeholder="e.g. Internal Architecture Specifications"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Reference Content Text *</label>
                    <textarea
                      style={{ width: '100%', minHeight: 140 }}
                      placeholder="Paste your source text, research snippets, or proprietary facts here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => setIngestModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={ingesting} className="btn-primary">
                  {ingesting ? 'Processing & Indexing...' : 'Ingest & Index'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reference Intelligence Report Modal */}
      {viewingDoc && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999, padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, width: '100%', maxWidth: 780,
            maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#6366f1', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
                  <span>AI REFERENCE ANALYSIS</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{viewingDoc.filename}</h2>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                  Indexed into {viewingDoc.chunk_count} Qdrant vectors • {viewingDoc.word_count.toLocaleString()} words
                </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="btn-ghost" style={{ fontSize: 22 }}>×</button>
            </div>

            {viewingDoc.analysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Main Subject</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>{viewingDoc.analysis.main_subject}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Key Themes</div>
                    <ul style={{ paddingLeft: 16, fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {viewingDoc.analysis.key_themes.map((th, i) => (
                        <li key={i}>{th}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Important Facts & Data</div>
                    <ul style={{ paddingLeft: 16, fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {viewingDoc.analysis.important_facts.map((fc, i) => (
                        <li key={i}>{fc}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Primary & Secondary Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {viewingDoc.analysis.primary_keywords.map((kw, i) => (
                      <span key={i} className="badge badge-primary">{kw}</span>
                    ))}
                    {viewingDoc.analysis.secondary_keywords.map((kw, i) => (
                      <span key={i} className="badge badge-neutral">{kw}</span>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#ecfdf5', padding: 18, borderRadius: 10, border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase', marginBottom: 6 }}>Content Opportunities</div>
                  <ul style={{ paddingLeft: 16, fontSize: '0.85rem', color: '#047857', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {viewingDoc.analysis.content_opportunities.map((opp, i) => (
                      <li key={i}>{opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
                <Clock size={32} style={{ margin: '0 auto 8px' }} />
                <p>Intelligence analysis is still processing. Please check back shortly.</p>
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setViewingDoc(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
