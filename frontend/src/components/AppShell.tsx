'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ marginTop: 64, padding: '32px', flex: 1, maxWidth: 1400, width: '100%', marginInline: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

