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

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  title: string;
  body: string;
  change_summary?: string;
  created_by?: string;
  created_at: string;
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

export interface HumanToneAuditResult {
  score: number;
  passes_human_test: boolean;
  total_violations: number;
  banned_words_found: string[];
  banned_phrases_found: string[];
  uncontracted_forms_found: string[];
  table_symbols_detected?: boolean;
  table_symbols_count?: number;
  burstiness_score?: number;
  burstiness_rating?: string;
  cliche_opener_detected: boolean;
  summary_conclusion_detected: boolean;
  suggested_replacements: Record<string, string>;
}

export interface ParaphraseHumanizeResponse {
  success: boolean;
  original_text: string;
  paraphrased_text: string;
  human_score: number;
  human_content_estimate?: number;
  passes_human_test: boolean;
  burstiness_score: number;
  burstiness_rating: string;
  plagiarism_risk: string;
  table_symbols_cleaned: number;
  banned_words_removed: string[];
  wordnet_matches_count?: number;
  local_model_matched?: boolean;
  paws_grounded?: boolean;
  wordnet_grounded?: boolean;
  compulsory_keywords_audit?: CompulsoryKeywordsAudit;
  audit: HumanToneAuditResult;
  duration_seconds: number;
  error?: string;
}

export interface PlatformKeywordItem {
  keyword: string;
  tag: 'V' | 'I' | 'E';
  notes?: string;
}

export interface MultiPlatformKeywordResult {
  offering_name: string;
  seed_keywords: string[];
  platform_groups: {
    search_engines: PlatformKeywordItem[];
    generative_ai: PlatformKeywordItem[];
    video_platforms: PlatformKeywordItem[];
    social_media: PlatformKeywordItem[];
    qa_and_forums: PlatformKeywordItem[];
    news_and_pr: PlatformKeywordItem[];
    podcasts_audio: PlatformKeywordItem[];
    backlink_authority: PlatformKeywordItem[];
  };
  top_seed_keywords: string[];
  top_platform_keywords: string[];
  quick_wins: { platform: string; opportunity: string }[];
  keyword_planner_tip: string;
}

export interface SerpGapResult {
  niche: string;
  keywords: string[];
  ai_overview_summary: string;
  competitor_landscape: {
    keyword: string;
    rank: number;
    page_title: string;
    url: string;
    brand: string;
    primary_angle: string;
  }[];
  common_topics: { topic: string; frequency: string }[];
  unique_angles: { brand_or_url: string; unique_coverage: string }[];
  content_gaps: { gap_area: string; why_it_matters: string }[];
  vague_generic_content_to_replace: { competitor_claim: string; flaw: string; how_we_fix: string }[];
  recommended_unique_additions: { addition: string; source_rationale: string }[];
  statistics: { stat: string; source_name: string; source_url: string; year: string }[];
  hard_numbers: { number: string; metric_type: string; source_name: string; source_url: string }[];
  people_also_ask: { question: string; intent: string; source_or_rationale: string }[];
}

export interface UrlRewriteResult {
  url: string;
  primary_keyword: string;
  before_diagnosis: {
    current_title?: string;
    current_meta?: string;
    current_h1?: string;
    word_count?: number;
    identified_gaps?: string[];
    schema_status?: string;
  };
  whats_changing_and_why: string[];
  replacement_content: {
    new_title_tag: string;
    new_meta_description: string;
    new_h1: string;
    body_markdown: string;
    comparison_table_markdown?: string;
    faq_items?: { question: string; answer: string }[];
    recommended_schema_json?: any;
    internal_links_to_add?: { anchor_text: string; target_topic: string }[];
    author_attribution: string;
  };
}

export interface SkillMetadata {
  name: string;
  alias: string;
  canonical_name: string;
  label: string;
  description: string;
  output_format: 'markdown' | 'json';
  needs_search: boolean;
  model_tier: 'fast' | 'strong';
}

export interface PipelineRouteResponse {
  request_type: string;
  steps: string[];
  missing_inputs: string[];
  defaults_assumed: Record<string, any>;
  needs_web_search: boolean;
  reasoning: string;
}

export interface WordNetFileStat {
  filename: string;
  description: string;
  category: string;
  size_mb: number;
  row_count: number;
}

export interface WordNetOverviewResponse {
  total_files: number;
  total_rows: number;
  total_size_mb: number;
  files: WordNetFileStat[];
  status: string;
  processed_artifacts: Array<{ filename: string; size_kb: number; modified_time: string }>;
}

export interface CombinedDatasetOverviewResponse {
  total_combined_rows: number;
  total_combined_files: number;
  paws: any;
  wordnet: WordNetOverviewResponse;
  all_processed_artifacts: Array<{ filename: string; size_kb: number; modified_time: string }>;
}

export interface PipelineExecutionLog {
  step_index: number;
  step_name: string;
  step_key: string;
  label: string;
  duration_seconds: number;
  format: string;
  error?: string | null;
}

export interface CompulsoryKeywordsAudit {
  total: number;
  found_count: number;
  missing_count: number;
  compliance_rate: number;
  found: string[];
  missing: string[];
  all_compulsory_present: boolean;
}

export interface PipelineExecutionResponse {
  success: boolean;
  pipeline: string[];
  total_duration_seconds: number;
  final_content: string;
  compulsory_keywords_audit?: CompulsoryKeywordsAudit;
  checklist: {
    sources_used: string[];
    claims_verification: string;
    schema_ready: boolean;
    qa_passed: boolean;
    suggested_next_step: string;
  };
  qa_scorecard?: {
    overall_score: number;
    scores?: Record<string, number>;
    checks?: Record<string, any>;
    highest_impact_fixes?: Array<{ original: string; suggested: string; reason: string }>;
  };
  fact_check_table?: Array<{
    claim: string;
    status: string;
    source_name: string;
    url: string;
    year: string | number;
    action_taken: string;
  }>;
  seo_package?: {
    titles?: Array<{ title: string; character_count: number; recommended: boolean }>;
    meta_descriptions?: Array<{ description: string; character_count: number; recommended: boolean }>;
    slug?: string;
    json_ld?: any;
  };
  step_results: Record<string, any>;
  step_logs: PipelineExecutionLog[];
  project_context: Record<string, any>;
}

export interface TrendingKeywordItem {
  keyword: string;
  type: 'rising' | 'top';
  value: string;
  extracted_value?: number | null;
  growth_rate?: string | null;
  search_intent: string;
  category: string;
}

export interface TrendingTopicSuggestion {
  title: string;
  angle: string;
  description: string;
  target_audience: string;
  content_format: string;
  recommended_platform: string;
  matched_keywords: string[];
  why_trending: string;
}

export interface GoogleTrendsResponse {
  topic: string;
  geo: string;
  date_range: string;
  source: string;
  rising_keywords: TrendingKeywordItem[];
  top_keywords: TrendingKeywordItem[];
  related_topics: { title: string; type?: string; growth?: string; is_rising?: boolean }[];
  suggested_topics: TrendingTopicSuggestion[];
  summary: string;
  total_found: number;
}



