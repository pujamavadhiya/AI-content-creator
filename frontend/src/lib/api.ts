import axios, { AxiosInstance } from 'axios';
import {
  Brand, ReferenceCollection, ReferenceDocument, Keyword,
  Topic, TopicCluster, ContentOutline, GeneratedContent,
  ContentEvaluation, CalendarEvent, AnalyticsSummary,
  AIProviderInfo, User, HumanToneAuditResult, MultiPlatformKeywordResult,
  SerpGapResult, UrlRewriteResult
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sevencore_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        // localStorage.removeItem('sevencore_token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const apiClient = {
  // --- Auth ---
  login: async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem('sevencore_token', res.data.access_token);
      localStorage.setItem('sevencore_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (payload: { email: string; password: string; full_name: string; organization_name: string }) => {
    const res = await api.post('/api/auth/register', payload);
    if (res.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem('sevencore_token', res.data.access_token);
      localStorage.setItem('sevencore_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sevencore_token');
      localStorage.removeItem('sevencore_user');
      window.location.href = '/login';
    }
  },

  // --- Brands ---
  getBrands: async (): Promise<Brand[]> => {
    const res = await api.get('/api/brands');
    return res.data;
  },

  createBrand: async (data: Partial<Brand>): Promise<Brand> => {
    const res = await api.post('/api/brands', data);
    return res.data;
  },

  updateBrand: async (id: string, data: Partial<Brand>): Promise<Brand> => {
    const res = await api.put(`/api/brands/${id}`, data);
    return res.data;
  },

  deleteBrand: async (id: string): Promise<void> => {
    await api.delete(`/api/brands/${id}`);
  },

  // --- Reference Library ---
  getCollections: async (brandId?: string): Promise<ReferenceCollection[]> => {
    const params = brandId ? { brand_id: brandId } : {};
    const res = await api.get('/api/references/collections', { params });
    return res.data;
  },

  createCollection: async (data: { name: string; description?: string; brand_id?: string }): Promise<ReferenceCollection> => {
    const res = await api.post('/api/references/collections', data);
    return res.data;
  },

  uploadDocument: async (collectionId: string, file: File): Promise<ReferenceDocument> => {
    const formData = new FormData();
    formData.append('collection_id', collectionId);
    formData.append('file', file);
    const res = await api.post('/api/references/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  ingestUrl: async (collectionId: string, url: string, title?: string): Promise<ReferenceDocument> => {
    const res = await api.post('/api/references/ingest-url', { collection_id: collectionId, url, title });
    return res.data;
  },

  ingestText: async (collectionId: string, title: string, text: string): Promise<ReferenceDocument> => {
    const res = await api.post('/api/references/text', { collection_id: collectionId, title, text });
    return res.data;
  },

  getDocuments: async (collectionId?: string): Promise<ReferenceDocument[]> => {
    const params = collectionId ? { collection_id: collectionId } : {};
    const res = await api.get('/api/references/documents', { params });
    return res.data;
  },

  getDocument: async (documentId: string): Promise<ReferenceDocument> => {
    const res = await api.get(`/api/references/documents/${documentId}`);
    return res.data;
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await api.delete(`/api/references/documents/${documentId}`);
  },

  // --- Research ---
  generateKeywords: async (payload: { topic: string; industry?: string; target_audience?: string; brand_id?: string; collection_id?: string }): Promise<Keyword[]> => {
    const res = await api.post('/api/research/keywords', payload);
    return res.data;
  },

  getKeywords: async (brandId?: string): Promise<Keyword[]> => {
    const params = brandId ? { brand_id: brandId } : {};
    const res = await api.get('/api/research/keywords', { params });
    return res.data;
  },

  generateTopics: async (payload: { primary_keyword: string; secondary_keywords?: string[]; industry?: string; brand_id?: string; collection_id?: string }): Promise<Topic[]> => {
    const res = await api.post('/api/research/topics', payload);
    return res.data;
  },

  getTopics: async (brandId?: string): Promise<Topic[]> => {
    const params = brandId ? { brand_id: brandId } : {};
    const res = await api.get('/api/research/topics', { params });
    return res.data;
  },

  clusterTopics: async (): Promise<TopicCluster[]> => {
    const res = await api.post('/api/research/clusters');
    return res.data;
  },

  generateOutline: async (topicId: string, brandId?: string, collectionId?: string): Promise<ContentOutline> => {
    const res = await api.post('/api/research/outlines', { topic_id: topicId, brand_id: brandId, collection_id: collectionId });
    return res.data;
  },

  getOutlines: async (): Promise<ContentOutline[]> => {
    const res = await api.get('/api/research/outlines');
    return res.data;
  },

  getOutline: async (id: string): Promise<ContentOutline> => {
    const res = await api.get(`/api/research/outlines/${id}`);
    return res.data;
  },

  updateOutline: async (id: string, data: any): Promise<ContentOutline> => {
    const res = await api.put(`/api/research/outlines/${id}`, data);
    return res.data;
  },

  // --- Content Generation ---
  generateBlog: async (payload: { outline_id?: string; topic_title?: string; desired_word_count?: number; writing_tone?: string; brand_id?: string; collection_id?: string }): Promise<GeneratedContent> => {
    const res = await api.post('/api/content/generate-blog', payload);
    return res.data;
  },

  generateSocial: async (payload: { topic_title?: string; platform: string; format_type: string; brand_id?: string; collection_id?: string }): Promise<GeneratedContent> => {
    const res = await api.post('/api/content/generate-social', payload);
    return res.data;
  },

  generateMultiPlatform: async (payload: { topic_title: string; platforms: string[]; brand_id?: string; collection_id?: string }): Promise<GeneratedContent[]> => {
    const res = await api.post('/api/content/generate-multiple', payload);
    return res.data;
  },

  rewriteText: async (payload: { selected_text: string; action: string; tone?: string; custom_instruction?: string }): Promise<{ revised_text: string }> => {
    const res = await api.post('/api/content/rewrite', payload);
    return res.data;
  },

  evaluateContent: async (contentId: string): Promise<ContentEvaluation> => {
    const res = await api.post(`/api/content/${contentId}/evaluate`);
    return res.data;
  },

  improveContentFromReport: async (contentId: string): Promise<GeneratedContent> => {
    const res = await api.post(`/api/content/${contentId}/improve-from-report`);
    return res.data;
  },

  getContentList: async (platform?: string, status?: string): Promise<GeneratedContent[]> => {
    const params: any = {};
    if (platform) params.platform = platform;
    if (status) params.status_filter = status;
    const res = await api.get('/api/content', { params });
    return res.data;
  },

  getContent: async (id: string): Promise<GeneratedContent> => {
    const res = await api.get(`/api/content/${id}`);
    return res.data;
  },

  updateContent: async (id: string, data: { title?: string; body?: string; status?: string }): Promise<GeneratedContent> => {
    const res = await api.put(`/api/content/${id}`, data);
    return res.data;
  },

  deleteContent: async (id: string): Promise<void> => {
    await api.delete(`/api/content/${id}`);
  },

  getExportUrl: (contentId: string, format: string) => {
    return `${API_BASE_URL}/api/content/${contentId}/export/${format}`;
  },

  // --- Calendar ---
  getCalendarEvents: async (platform?: string): Promise<CalendarEvent[]> => {
    const params = platform ? { platform } : {};
    const res = await api.get('/api/calendar', { params });
    return res.data;
  },

  scheduleCalendar: async (data: { content_id: string; scheduled_date: string; platform: string; notes?: string }): Promise<CalendarEvent> => {
    const res = await api.post('/api/calendar', data);
    return res.data;
  },

  deleteCalendarEvent: async (id: string): Promise<void> => {
    await api.delete(`/api/calendar/${id}`);
  },

  // --- Analytics ---
  getAnalyticsSummary: async (): Promise<AnalyticsSummary> => {
    const res = await api.get('/api/analytics/summary');
    return res.data;
  },

  // --- AI Settings ---
  getProviders: async (): Promise<AIProviderInfo[]> => {
    const res = await api.get('/api/ai/providers');
    return res.data;
  },

  saveCredential: async (providerSlug: string, apiKey: string): Promise<{ status: string; message: string }> => {
    const res = await api.post('/api/ai/credentials', { provider_slug: providerSlug, api_key: apiKey });
    return res.data;
  },

  testConnection: async (providerSlug: string): Promise<{ provider_slug: string; success: boolean; message: string; model: string }> => {
    const res = await api.post('/api/ai/test-connection', { provider_slug: providerSlug });
    return res.data;
  },

  // --- Specialized Skills ---
  // Skill 1: Human-Tone Writer & Anti-AI Blacklist Auditor
  auditHumanTone: async (text: string): Promise<HumanToneAuditResult> => {
    const res = await api.post('/api/content/human-audit', { text });
    return res.data;
  },

  // Skill 2: Multi-Platform Keyword Research Engine (Keyword Planner Seeds + 8 Platform Groups)
  generateMultiPlatformKeywords: async (data: {
    topic: string;
    industry?: string;
    target_audience?: string;
    business_type?: string;
    brand_id?: string;
  }): Promise<MultiPlatformKeywordResult> => {
    const res = await api.post('/api/research/keywords/multi-platform', data);
    return res.data;
  },

  // Skill 3: Live Page Audit & AEO Content Rewriter with URL
  rewriteUrlContent: async (data: {
    url: string;
    primary_keyword?: string;
    page_type?: string;
    author_name?: string;
  }): Promise<UrlRewriteResult> => {
    const res = await api.post('/api/content/url-rewrite', data);
    return res.data;
  },

  // Skill 4: SERP Gap Research & Competitor Optimization
  analyzeSerpGaps: async (data: {
    keywords: string[];
    niche: string;
    content_type?: string;
    intent_preference?: string;
    language?: string;
  }): Promise<SerpGapResult> => {
    const res = await api.post('/api/research/serp-gap', data);
    return res.data;
  },

  exportSerpGapDocx: async (data: SerpGapResult): Promise<Blob> => {
    const res = await api.post('/api/research/serp-gap/export', data, {
      responseType: 'blob'
    });
    return res.data;
  },
};

