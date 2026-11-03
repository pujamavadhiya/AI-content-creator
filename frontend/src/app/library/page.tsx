'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban, Search, Download, Trash2, Edit3,
  ExternalLink, FileSpreadsheet, FileText, CheckCircle2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { GeneratedContent } from '@/types';

export default function ContentLibraryPage() {
  const { showToast } = useApp();

  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getContentList(platformFilter || undefined, statusFilter || undefined);
      setContents(data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [platformFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    if (confirm('Permanently delete this content asset?')) {
      try {
        await apiClient.deleteContent(id);
        showToast('Asset deleted', 'info');
        await fetchContents();
      } catch (e) {
        showToast('Failed to delete asset', 'error');
      }
    }
  };

  const filteredContents = contents.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Unified Content Library
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Search, filter, edit, and export all generated articles, social posts, and multi-channel campaigns.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/content/export/all/csv`}
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/content/export/all/excel`}
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.8rem' }}
          >
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 18, marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          <input
            style={{ width: '100%', paddingLeft: 34, fontSize: '0.875rem' }}
            placeholder="Search all content drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">All Platforms</option>
            <option value="Blog">Blog</option>
            <option value="Linkedin">LinkedIn</option>
            <option value="Instagram">Instagram</option>
            <option value="Twitter">Twitter / X</option>
            <option value="Facebook">Facebook</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {filteredContents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
            <FolderKanban size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>No Assets Found</h4>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
              Try adjusting your search filters or generate new articles in the Blog Writer or Social Studio.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Title</th>
                <th style={{ padding: '12px 16px' }}>Platform</th>
                <th style={{ padding: '12px 16px' }}>Word Count</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Exports</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContents.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a', maxWidth: 360 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-primary">{c.platform}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.word_count.toLocaleString()} words</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${c.status === 'approved' ? 'badge-success' : 'badge-neutral'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a
                        href={apiClient.getExportUrl(c.id, 'docx')}
                        className="btn-ghost"
                        title="Download DOCX"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                      >
                        DOCX
                      </a>
                      <a
                        href={apiClient.getExportUrl(c.id, 'pdf')}
                        className="btn-ghost"
                        title="Download PDF"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                      >
                        PDF
                      </a>
                      <a
                        href={apiClient.getExportUrl(c.id, 'md')}
                        className="btn-ghost"
                        title="Download Markdown"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                      >
                        MD
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <Link
                        href={`/writer?id=${c.id}`}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="btn-ghost"
                        style={{ color: '#ef4444' }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

