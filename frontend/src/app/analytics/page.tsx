'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Cpu, DollarSign,
  Activity, Layers, FileText, CheckCircle2, RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { AnalyticsSummary } from '@/types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAnalyticsSummary();
      setAnalytics(data);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Usage & Analytics Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Recorded telemetry, token consumption, estimated API expenditures, and platform generation frequency.
          </p>
        </div>
        <button onClick={fetchAnalytics} className="btn-secondary">
          <RefreshCw size={15} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ background: 'white', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Estimated API Spend</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            ${analytics?.estimated_api_cost.toFixed(4) || '0.0000'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Calculated from actual token usage</div>
        </div>

        <div style={{ background: 'white', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Tokens</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            {((analytics?.total_input_tokens || 0) + (analytics?.total_output_tokens || 0)).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            In: {(analytics?.total_input_tokens || 0).toLocaleString()} • Out: {(analytics?.total_output_tokens || 0).toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'white', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assets Published</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            {((analytics?.total_blogs || 0) + (analytics?.total_social_posts || 0)).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Blogs: {analytics?.total_blogs || 0} • Social: {analytics?.total_social_posts || 0}
          </div>
        </div>

        <div style={{ background: 'white', padding: 22, borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vector Knowledge</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
            {analytics?.total_references || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Across {analytics?.total_collections || 0} reference collections
          </div>
        </div>
      </div>

      {/* Platform Breakdown & Activity Trail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Platform Breakdown */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
            Platform Production Share
          </h3>

          {analytics?.platform_breakdown && analytics.platform_breakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {analytics.platform_breakdown.map((item, idx) => {
                const total = (analytics.total_blogs || 0) + (analytics.total_social_posts || 0) || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: 6 }}>
                      <span>{item.platform}</span>
                      <span>{item.count} items ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#6366f1' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              No production breakdown recorded yet.
            </div>
          )}
        </div>

        {/* Audit Activity Trail */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
            Recent Activity Log
          </h3>

          {analytics?.recent_activities && analytics.recent_activities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {analytics.recent_activities.map((act) => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity size={16} color="#6366f1" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                        {act.action.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Entity: {act.entity_type}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{act.created_at}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              No recent activities recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

