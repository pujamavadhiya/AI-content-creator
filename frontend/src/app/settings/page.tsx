'use client';

import React, { useState } from 'react';
import {
  Settings, Building2, Shield, Users, Key,
  CheckCircle2, Lock, Database
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SettingsPage() {
  const { user, showToast } = useApp();

  const [orgName, setOrgName] = useState('Sevencore Media Enterprise');
  const [adminEmail, setAdminEmail] = useState(user?.email || 'architect@sevencore.ai');
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Organization settings updated', 'success');
    }, 500);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Organization & Security Settings
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
          Multi-tenant isolation, role-based access control (RBAC), and enterprise encryption safeguards.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'flex-start' }}>
        {/* Main Settings Form */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Organization Profile
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
            Manage organizational identifier and workspace parameters.
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Organization Name
              </label>
              <input
                style={{ width: '100%', fontSize: '0.95rem' }}
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Primary Administrator Email
              </label>
              <input
                type="email"
                style={{ width: '100%', fontSize: '0.95rem' }}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Tenant Identifier (UUID / Slug)
              </label>
              <input
                style={{ width: '100%', fontFamily: 'monospace', background: '#f8fafc', color: '#64748b' }}
                value="sevencore-media-org-01"
                disabled
              />
            </div>

            <div style={{ paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Multi-Tenancy Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>Multi-Tenant Isolation</h3>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Active & Enforced</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.825rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>Strict Org-Level DB Filtering</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>Qdrant Tenant Vector Partitioning</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>Fernet Encrypted API Keys</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>RBAC Route Protection</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              Active User Role
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="badge badge-primary">{user?.role || 'Super Admin'}</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Full Permission Tier</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
              Available roles: Super Admin, Organization Admin, Editor, Content Writer, Viewer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

