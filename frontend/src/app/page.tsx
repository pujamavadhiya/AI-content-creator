'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, PenTool, Share2, BookOpen, KeyRound,
  ArrowRight, FileText, CheckCircle2, TrendingUp, Cpu
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { AnalyticsSummary, GeneratedContent } from '@/types';

export default function DashboardPage() {
  const { activeBrand, showToast } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentContent, setRecentContent] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, contents] = await Promise.all([
          apiClient.getAnalyticsSummary(),
          apiClient.getContentList()
        ]);
        setAnalytics(sum);
        setRecentContent(contents.slice(0, 5));
      } catch (e) {
        // Fallback default metrics for initial empty database
        setAnalytics({
          total_references: 0,
          total_collections: 0,
          total_blogs: 0,
          total_social_posts: 0,
          total_keywords: 0,
          total_topics: 0,
          total_calendar_scheduled: 0,
          estimated_api_cost: 0.0,
          total_input_tokens: 0,
          total_output_tokens: 0,
          platform_breakdown: [],
          recent_activities: []
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      {/* Welcome & Active Context Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        borderRadius: 16,
        padding: '36px 40px',
        color: 'white',
        marginBottom: 32,
        boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 600, marginBottom: 16 }}>
            <Sparkles size={14} color="#a5b4fc" />
            <span>AI Content Intelligence Platform</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
            {activeBrand ? `Welcome back to ${activeBrand.name}` : 'Welcome to Sevencore AI'}
          </h1>
          <p style={{ color: '#c7d2fe', fontSize: '1rem', lineHeight: 1.6 }}>
            Ground your marketing in verified reference knowledge. Create SEO-optimized blogs, high-converting LinkedIn posts, and multi-platform content campaigns with zero hallucinations.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/research" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            <Sparkles size={18} />
            <span>Start 10-Step Workflow</span>
          </Link>
          <Link href="/references" className="btn-secondary" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
            <BookOpen size={16} />
            <span>Ingest References</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ background: 'white', padding: 22, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Reference Documents</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{analytics?.total_references || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} />
            <span>Indexed in Qdrant Vector DB</span>
          </div>
        </div>

        <div style={{ background: 'white', padding: 22, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Generated Articles</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{analytics?.total_blogs || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#6366f1', marginTop: 4 }}>500–3000w SEO Posts</div>
        </div>

        <div style={{ background: 'white', padding: 22, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Social Studio Posts</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{analytics?.total_social_posts || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#0ea5e9', marginTop: 4 }}>LinkedIn, IG, FB, X Threads</div>
        </div>

        <div style={{ background: 'white', padding: 22, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Scheduled Publishing</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{analytics?.total_calendar_scheduled || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: 4 }}>Content Calendar Ready</div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
        Quick Creation Workflows
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 36 }}>
        <Link href="/writer" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', marginBottom: 16 }}>
            <PenTool size={20} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Blog & Article Writer</div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
            Produce comprehensive articles (500–3000w) grounded in your reference documents with inline AI editing tools.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6366f1', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Open Studio</span>
            <ArrowRight size={15} />
          </div>
        </Link>

        <Link href="/social" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: 16 }}>
            <Share2 size={20} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Multi-Platform Social Studio</div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
            Turn one topic into native LinkedIn thought leadership, 7-slide Instagram carousels, and 8-post Twitter/X threads.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Generate Posts</span>
            <ArrowRight size={15} />
          </div>
        </Link>

        <Link href="/keywords" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', textDecoration: 'none' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', marginBottom: 16 }}>
            <KeyRound size={20} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>10-Category Keyword Engine</div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, marginBottom: 16, flex: 1 }}>
            Discover primary, semantic, long-tail, and question-based keywords mapped directly from reference insights.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706', fontSize: '0.875rem', fontWeight: 600 }}>
            <span>Explore Keywords</span>
            <ArrowRight size={15} />
          </div>
        </Link>
      </div>

      {/* Recent Generated Content Table */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>Recent Generated Content</h2>
          <Link href="/library" style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>View All in Library →</Link>
        </div>

        {recentContent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No content generated yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Start by creating your first article or social post using the buttons above.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Title</th>
                <th style={{ padding: '12px 16px' }}>Platform</th>
                <th style={{ padding: '12px 16px' }}>Word Count</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentContent.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{c.title}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge badge-primary">{c.platform}</span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b' }}>{c.word_count} words</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${c.status === 'approved' ? 'badge-success' : 'badge-neutral'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <Link href={`/writer?id=${c.id}`} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      Edit / Export
                    </Link>
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
