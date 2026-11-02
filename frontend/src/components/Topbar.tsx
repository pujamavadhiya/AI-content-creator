'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, BookMarked, Sparkles, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import styles from './Topbar.module.scss';

export const Topbar: React.FC = () => {
  const { brands, activeBrand, setActiveBrand, activeCollection } = useApp();

  return (
    <header className={styles.topbar}>
      <div className={styles.leftSection}>
        <div className={styles.brandSelector}>
          <Building2 size={16} color="#6366f1" />
          <span className={styles.brandLabel}>Active Brand:</span>
          <select
            value={activeBrand?.id || ''}
            onChange={(e) => {
              const b = brands.find((brand) => brand.id === e.target.value);
              setActiveBrand(b || null);
            }}
          >
            {brands.length === 0 ? (
              <option value="">No Brands Created</option>
            ) : (
              brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.industry})
                </option>
              ))
            )}
          </select>
        </div>

        {activeCollection && (
          <div className={styles.collectionPill}>
            <BookMarked size={14} />
            <span>Ref: {activeCollection.name}</span>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        <div className={styles.aiStatus}>
          <span className={styles.indicator} />
          <span>Gemini AI Connected</span>
        </div>

        <Link href="/writer" className={styles.createBtn}>
          <Plus size={16} />
          <span>Write Blog</span>
        </Link>

        <Link href="/social" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          <Sparkles size={14} />
          <span>Social Studio</span>
        </Link>
      </div>
    </header>
  );
};
