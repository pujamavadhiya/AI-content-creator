'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, BookOpen, Sparkles, KeyRound,
  Compass, ListOrdered, PenTool, Share2, Calendar,
  FolderKanban, Cpu, BarChart3, Settings, LogOut
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import styles from './Sidebar.module.scss';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useApp();

  const navigationGroups = [
    {
      title: 'Core Platform',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard },
        { label: 'Brand Profiles', href: '/brands', icon: Building2 },
        { label: 'Reference Library', href: '/references', icon: BookOpen },
      ]
    },
    {
      title: 'Intelligence & Planning',
      items: [
        { label: 'Research & RAG', href: '/research', icon: Sparkles },
        { label: 'Keyword Research', href: '/keywords', icon: KeyRound },
        { label: 'Topic Generator', href: '/topics', icon: Compass },
        { label: 'Content Outlines', href: '/outlines', icon: ListOrdered },
      ]
    },
    {
      title: 'Studio & Publishing',
      items: [
        { label: 'Blog & Article Writer', href: '/writer', icon: PenTool },
        { label: 'Social Media Studio', href: '/social', icon: Share2 },
        { label: 'Content Calendar', href: '/calendar', icon: Calendar },
        { label: 'Content Library', href: '/library', icon: FolderKanban },
      ]
    },
    {
      title: 'Administration',
      items: [
        { label: 'AI Model Settings', href: '/models', icon: Cpu },
        { label: 'Usage & Analytics', href: '/analytics', icon: BarChart3 },
        { label: 'Settings', href: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandHeader}>
        <div className={styles.logoIcon}>S</div>
        <span className={styles.brandName}>Sevencore AI</span>
        <span className={styles.badgePro}>Enterprise</span>
      </div>

      <nav className={styles.navSection}>
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className={styles.sectionTitle}>{group.title}</div>
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon className={styles.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.avatar}>
          {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.full_name || 'Admin User'}</div>
          <div className={styles.userRole}>{user?.role || 'Super Admin'}</div>
        </div>
        <button
          onClick={() => apiClient.logout()}
          title="Sign out"
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

