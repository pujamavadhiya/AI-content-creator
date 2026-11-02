export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  organization_id: string;
  created_at: string;
}

export interface BrandGuideline {
  restricted_words: string[];
  preferred_keywords: string[];
  competitors: string[];
  products_services: any[];
}

export interface Brand {
  id: string;
  organization_id: string;
  name: string;
  company_name?: string;
  industry: string;
  business_description?: string;
  website_url?: string;
  target_audience?: string;
  target_geographical_market?: string;
  preferred_language: string;
  brand_voice: string;
  writing_tone: string;
  communication_style: string;
  content_objectives?: string;
  preferred_cta_style: string;
  custom_instructions?: string;
  guidelines?: BrandGuideline;
  created_at: string;
  updated_at: string;
}

export interface ReferenceCollection {
  id: string;
  organization_id: string;
  brand_id?: string;
  name: string;
  description?: string;
  reference_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReferenceAnalysis {
  id: string;
  document_id: string;
  main_subject: string;
  key_themes: string[];
  main_arguments: string[];
  important_facts: string[];
  important_entities: string[];
  industry_terminology: string[];
  primary_keywords: string[];
  secondary_keywords: string[];
  search_intent?: string;
  target_audience?: string;
  writing_tone?: string;
  content_structure: string[];
  recurring_topics: string[];
  knowledge_gaps: string[];
  content_opportunities: string[];
  created_at: string;
}

export interface ReferenceDocument {
  id: string;
  collection_id: string;
  organization_id: string;
  filename: string;
  file_type: string;
  source_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  word_count: number;
  chunk_count: number;
  analysis?: ReferenceAnalysis;
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  category: string;
  search_intent: string;
  relevance_score: number;
  related_topic?: string;
  suggested_content_type?: string;
  supporting_reference?: string;
  search_volume: string;
  difficulty: string;
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: string;
  target_audience?: string;
  content_angle?: string;
  content_format: string;
  suggested_cta?: string;
  relevance_score: number;
  supporting_reference_info?: string;
  recommended_platform: string;
  status: string;
  created_at: string;
}

export interface TopicCluster {
  id: string;
  cluster_name: string;
  pillar_topic_id: string;
  pillar_topic?: Topic;
  supporting_topics: Topic[];
  related_keywords: string[];
  internal_linking_strategy?: string;
}

export interface HeadingNode {
  h2: string;
  h3: string[];
  points: string[];
}

export interface FAQItem {
  q: string;
  a_outline: string;
}

export interface ContentOutline {
  id: string;
  topic_id?: string;
  brand_id?: string;
  title: string;
  seo_title_suggestions: string[];
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: string;
  target_audience?: string;
  content_objective?: string;
  meta_title?: string;
  meta_description?: string;
  url_slug_suggestion?: string;
  introduction_structure?: string;
  h1_heading: string;
  headings_hierarchy: HeadingNode[];
  suggested_examples: string[];
  faqs: FAQItem[];
  conclusion_structure?: string;
  cta?: string;
  internal_links_suggested: string[];
  supporting_references: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedContent {
  id: string;
  organization_id: string;
  brand_id?: string;
  outline_id?: string;
  title: string;
  content_type: string;
  platform: string;
  body: string;
  word_count: number;
  character_count: number;
  status: string;
  is_archived: number;
  metadata_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContentEvaluation {
  id: string;
  content_id: string;
  overall_score: number;
  dimension_scores: Record<string, number>;
  issues_identified: string[];
  suggested_improvements: string[];
  unsupported_claims: string[];
  missing_information: string[];
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  organization_id: string;
  content_id: string;
  content_title?: string;
  scheduled_date: string;
  platform: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_references: number;
  total_collections: number;
  total_blogs: number;
  total_social_posts: number;
  total_keywords: number;
  total_topics: number;
  total_calendar_scheduled: number;
  estimated_api_cost: number;
  total_input_tokens: number;
  total_output_tokens: number;
  platform_breakdown: { platform: string; count: number }[];
  recent_activities: { id: string; action: string; entity_type: string; created_at: string }[];
}

export interface AIProviderInfo {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  default_model: string;
  embedding_model: string;
  has_key_configured: boolean;
  key_hint?: string;
  last_tested_at?: string;
}
