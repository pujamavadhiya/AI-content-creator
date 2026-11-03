'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Brand, ReferenceCollection, User } from '@/types';
import { apiClient } from '@/lib/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  brands: Brand[];
  activeBrand: Brand | null;
  setActiveBrand: (b: Brand | null) => void;
  refreshBrands: () => Promise<void>;
  collections: ReferenceCollection[];
  activeCollection: ReferenceCollection | null;
  setActiveCollection: (c: ReferenceCollection | null) => void;
  refreshCollections: () => Promise<void>;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [collections, setCollections] = useState<ReferenceCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<ReferenceCollection | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshBrands = async () => {
    try {
      const data = await apiClient.getBrands();
      setBrands(data);
      if (data.length > 0 && !activeBrand) {
        setActiveBrand(data[0]);
      }
    } catch (err) {
      // In dev or initial load without login, silent fallback
    }
  };

  const refreshCollections = async () => {
    try {
      const data = await apiClient.getCollections(activeBrand?.id);
      setCollections(data);
      if (data.length > 0 && !activeCollection) {
        setActiveCollection(data[0]);
      }
    } catch (err) {
      // silent fallback
    }
  };

  useEffect(() => {
    // Check local storage for initial auth
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('sevencore_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
      refreshBrands();
      refreshCollections();
    }
  }, []);

  useEffect(() => {
    if (activeBrand) {
      refreshCollections();
    }
  }, [activeBrand]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        brands,
        activeBrand,
        setActiveBrand,
        refreshBrands,
        collections,
        activeCollection,
        setActiveCollection,
        refreshCollections,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'white',
              backgroundColor: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: 260,
              animation: 'fadeIn 0.2s ease-in',
            }}
          >
            <span>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginLeft: 12, fontSize: 16 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

