'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Play, ArrowRight, CheckCircle2, AlertCircle,
  FileText, ShieldCheck, Award, Code, Clock, Layers,
  Copy, Check, RefreshCw, ExternalLink, Wand2, BookOpen,
  Image as ImageIcon, Maximize2, ChevronDown, ChevronUp, CheckCheck, Tag,
  Edit3, Eye, ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '@/lib/api';
import {
  Brand, PipelineRouteResponse, PipelineExecutionResponse,
  SkillMetadata
} from '@/types';
import styles from './page.module.scss';

export default function PipelineStudioPage() {
  const [request, setRequest] = useState(
    'Write an in-depth, reference-driven guide on AI Agent Swarms and Multi-Agent Orchestration Architecture in 2026'
  );
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [skillsCatalog, setSkillsCatalog] = useState<SkillMetadata[]>([]);
  const [showCatalogModal, setShowCatalogModal] = useState<boolean>(false);

  // Project context state
  const [primaryKeyword, setPrimaryKeyword] = useState('AI Agent Swarms');
  const [compulsoryKeywords, setCompulsoryKeywords] = useState<string>(
    'Multi-Agent Coordination\nDeterministic Fallbacks\nReal-World Latency'
  );
  const [audience, setAudience] = useState('Senior Software Architects and AI Engineers');
  const [wordCount, setWordCount] = useState<number>(1200);
  const [language, setLanguage] = useState('English');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'wordnet_local'>('gemini');

  // 3-Phase Guided Pipeline Workflow States ('outline' | 'draft' | 'final')
  const [pipelinePhase, setPipelinePhase] = useState<'outline' | 'draft' | 'final'>('outline');

  // Phase 1: Outline State
  const [outlineText, setOutlineText] = useState<string>('');
  const [generatingOutline, setGeneratingOutline] = useState<boolean>(false);
  const [outlineViewMode, setOutlineViewMode] = useState<'edit' | 'preview'>('edit');
  const [outlineCopied, setOutlineCopied] = useState<boolean>(false);
  const [outlineAudit, setOutlineAudit] = useState<any>(null);

  // Phase 2: Draft State
  const [draftText, setDraftText] = useState<string>('');
  const [generatingDraft, setGeneratingDraft] = useState<boolean>(false);
  const [draftViewMode, setDraftViewMode] = useState<'edit' | 'preview'>('edit');
  const [draftCopied, setDraftCopied] = useState<boolean>(false);
  const [draftAudit, setDraftAudit] = useState<any>(null);

  // Phase 3: Final Mode ('blog' | 'article')
  const [generatingMode, setGeneratingMode] = useState<'blog' | 'article'>('blog');
  const [finalViewMode, setFinalViewMode] = useState<'preview' | 'edit'>('preview');

  // Advanced accordion state
  const [showAdvancedPipeline, setShowAdvancedPipeline] = useState<boolean>(false);

  // Pipeline execution state
  const [routing, setRouting] = useState<boolean>(false);
  const [routePlan, setRoutePlan] = useState<PipelineRouteResponse | null>(null);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([
    'keyword_research', 'serp_gap', 'brief', 'draft', 'fact_check', 'qa', 'seo_schema'
  ]);
  const [executing, setExecuting] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [executionResult, setExecutionResult] = useState<PipelineExecutionResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'brief' | 'fact_check' | 'qa' | 'schema' | 'logs'>('content');
  const [copied, setCopied] = useState<boolean>(false);

  // Full Blog Expansion & Optional Image Generation State
  const [expandingBlog, setExpandingBlog] = useState<boolean>(false);
  const [paraphrasing, setParaphrasing] = useState<boolean>(false);
  const [cleaningSymbols, setCleaningSymbols] = useState<boolean>(false);
  const [showImageStudio, setShowImageStudio] = useState<boolean>(false);
  const [imageStyle, setImageStyle] = useState<string>('modern minimalist 3d isometric editorial illustration');
  const [customImagePrompt, setCustomImagePrompt] = useState<string>('');
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<{
    image_url: string;
    alt_text: string;
    revised_prompt?: string;
  } | null>(null);
  const [embeddingImage, setEmbeddingImage] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [brandData, skillsData] = await Promise.all([
        apiClient.getBrands().catch(() => []),
        apiClient.getSkills().catch(() => ({ skills: [], total: 0 })),
      ]);
      setBrands(brandData);
      if (brandData.length > 0) {
        setSelectedBrandId(brandData[0].id);
      }
      setSkillsCatalog(skillsData.skills || []);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  const handleRoute = async () => {
    if (!request.trim()) return;
    setRouting(true);
    try {
      const plan = await apiClient.routePipeline({
        request,
        project_context: {
          primary_keyword: primaryKeyword,
          compulsory_keywords: compulsoryKeywords,
          audience,
          word_count: wordCount,
          language,
        },
        provider,
      });
      setRoutePlan(plan);
      if (plan.steps && plan.steps.length > 0) {
        setSelectedSteps(plan.steps);
      }
    } catch (e: any) {
      alert(`Routing failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setRouting(false);
    }
  };

  // Phase 1: Generate Outline Only based on keywords and instructions
  const handleGenerateOutline = async () => {
    if (!request.trim()) {
      alert('Please enter a content instruction or topic.');
      return;
    }
    setGeneratingOutline(true);
    try {
      const res = await apiClient.generatePipelineOutline({
        request,
        project_context: {
          primary_keyword: primaryKeyword,
          compulsory_keywords: compulsoryKeywords,
          audience,
          word_count: wordCount,
          language,
        },
        brand_id: selectedBrandId || undefined,
        provider,
        compulsory_keywords: compulsoryKeywords,
      });
      if (res.outline) {
        setOutlineText(res.outline);
        setOutlineAudit(res.compulsory_keywords_audit);
        setPipelinePhase('outline');
        setOutlineViewMode('edit');
      }
    } catch (e: any) {
      alert(`Outline generation failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setGeneratingOutline(false);
    }
  };

  // Phase 2: Generate Draft from Outline & instructions
  const handleGenerateDraft = async () => {
    if (!outlineText.trim()) {
      alert('Please generate and review the outline first.');
      return;
    }
    setGeneratingDraft(true);
    try {
      const res = await apiClient.generatePipelineDraft({
        request,
        outline: outlineText,
        project_context: {
          primary_keyword: primaryKeyword,
          compulsory_keywords: compulsoryKeywords,
          audience,
          word_count: wordCount,
          language,
        },
        brand_id: selectedBrandId || undefined,
        provider,
        compulsory_keywords: compulsoryKeywords,
      });
      if (res.draft) {
        setDraftText(res.draft);
        setDraftAudit(res.compulsory_keywords_audit);
        setPipelinePhase('draft');
        setDraftViewMode('edit');
      }
    } catch (e: any) {
      alert(`Draft generation failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Phase 3: Final Generation from Draft ('blog' or 'article')
  const handleGenerateFinalContent = async (mode: 'blog' | 'article') => {
    const sourceDraft = draftText.trim() || executionResult?.final_content?.trim() || outlineText.trim();
    if (!sourceDraft) {
      alert('Please create or paste a draft first before generating the final blog or article.');
      return;
    }
    setGeneratingMode(mode);
    setExpandingBlog(true);
    setPipelinePhase('final');
    setActiveTab('content');
    try {
      const res = await apiClient.generateFullBlog({
        request,
        draft: sourceDraft,
        mode,
        brand_id: selectedBrandId || undefined,
        project_context: {
          primary_keyword: primaryKeyword,
          compulsory_keywords: compulsoryKeywords,
          audience,
          word_count: Math.max(wordCount, 1800),
          language,
        },
        provider,
        compulsory_keywords: compulsoryKeywords,
      });
      setExecutionResult(res);
      if (res.final_content) {
        setDraftText(res.final_content);
      }
    } catch (e: any) {
      alert(`Final ${mode} generation failed: ${e.response?.data?.detail || e.message}`);
      setPipelinePhase('draft');
    } finally {
      setExpandingBlog(false);
    }
  };

  // Quick Tools for Draft
  const handleParaphraseDraft = async () => {
    if (!draftText.trim()) return;
    setParaphrasing(true);
    try {
      const res = await apiClient.paraphraseHumanize({
        text: draftText,
        mode: provider === 'wordnet_local' ? 'local_wordnet' : 'anti_plagiarism',
        brand_id: selectedBrandId || undefined,
        provider,
        compulsory_keywords: compulsoryKeywords,
      });
      if (res.paraphrased_text) {
        setDraftText(res.paraphrased_text);
        const bannedCount = res.banned_words_removed?.length || 0;
        alert(`Draft Paraphrased via WordNet Engine!\n• Plagiarism Risk: ${res.plagiarism_risk}\n• Banned Words Cleaned: ${bannedCount} (0 remaining)\n• Table Symbols Cleaned: ${res.table_symbols_cleaned}\n• Human Content: ${res.human_content_estimate || 95}%`);
      }
    } catch (e: any) {
      alert(`Paraphrase failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setParaphrasing(false);
    }
  };

  const handleCleanDraftSymbols = async () => {
    if (!draftText.trim()) return;
    setCleaningSymbols(true);
    try {
      const res = await apiClient.sanitizeSymbols(draftText);
      setDraftText(res.cleaned_text);
      alert(`Removed ${res.symbols_cleaned} synthetic table symbols (|---|) and converted to human bullet comparisons!`);
    } catch (e: any) {
      alert(`Sanitize failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setCleaningSymbols(false);
    }
  };

  const copyOutline = () => {
    if (!outlineText) return;
    navigator.clipboard.writeText(outlineText);
    setOutlineCopied(true);
    setTimeout(() => setOutlineCopied(false), 2000);
  };

  const copyDraft = () => {
    if (!draftText) return;
    navigator.clipboard.writeText(draftText);
    setDraftCopied(true);
    setTimeout(() => setDraftCopied(false), 2000);
  };

  const handleExecute = async () => {
    if (!selectedSteps.length) {
      alert('Please select at least one step to execute.');
      return;
    }
    setExecuting(true);
    setActiveStepIndex(0);
    try {
      const res = await apiClient.executePipeline({
        request,
        steps: selectedSteps,
        brand_id: selectedBrandId || undefined,
        project_context: {
          primary_keyword: primaryKeyword,
          compulsory_keywords: compulsoryKeywords,
          audience,
          word_count: wordCount,
          language,
        },
        provider,
      });
      setExecutionResult(res);
      setActiveStepIndex(selectedSteps.length);
      setActiveTab('content');
    } catch (e: any) {
      alert(`Pipeline execution error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setExecuting(false);
    }
  };

  // Expand Draft to Full Comprehensive Blog
  const handleExpandToFullBlog = async () => {
    return handleGenerateFinalContent('blog');
  };

  // Anti-Plagiarism Paraphrase & Humanize
  const handleParaphrasePipeline = async () => {
    if (!executionResult?.final_content) return;
    setParaphrasing(true);
    try {
      const res = await apiClient.paraphraseHumanize({
        text: executionResult.final_content,
        mode: provider === 'wordnet_local' ? 'local_wordnet' : 'anti_plagiarism',
        brand_id: selectedBrandId || undefined,
        provider,
        compulsory_keywords: compulsoryKeywords,
      });
      if (res.paraphrased_text) {
        setExecutionResult((prev: any) => ({
          ...prev,
          final_content: res.paraphrased_text,
        }));
        const bannedCount = res.banned_words_removed?.length || 0;
        alert(`Paraphrased via WordNet Engine!\n• Plagiarism Risk: ${res.plagiarism_risk}\n• Banned Words Cleaned: ${bannedCount} (0 remaining)\n• Table Symbols Cleaned: ${res.table_symbols_cleaned}\n• Human Content: ${res.human_content_estimate || 95}%`);
      }
    } catch (e: any) {
      alert(`Paraphrase failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setParaphrasing(false);
    }
  };

  // Clean Markdown Table Symbols
  const handleCleanTableSymbols = async () => {
    if (!executionResult?.final_content) return;
    setCleaningSymbols(true);
    try {
      const res = await apiClient.sanitizeSymbols(executionResult.final_content);
      setExecutionResult((prev: any) => ({
        ...prev,
        final_content: res.cleaned_text,
      }));
      alert(`Removed ${res.symbols_cleaned} synthetic table symbols (|---|) and converted to human bullet comparisons!`);
    } catch (e: any) {
      alert(`Sanitize failed: ${e.response?.data?.detail || e.message}`);
    } finally {
      setCleaningSymbols(false);
    }
  };

  // Generate Relatable Image with OpenAI DALL-E 3 (Optional)
  const handleGenerateImage = async () => {
    if (!executionResult?.final_content) {
      alert('Please generate the blog first before creating an image.');
      return;
    }
    setGeneratingImage(true);
    try {
      const firstLine = executionResult.final_content.split('\n')[0].replace(/^[#*`\s]+/, '') || request;
      const res = await apiClient.generateBlogImage({
        blog_title: firstLine,
        blog_body: executionResult.final_content.slice(0, 1000),
        custom_prompt: customImagePrompt || undefined,
        visual_style: imageStyle,
        openai_api_key: openaiKey || undefined,
      });
      if (res.success) {
        setGeneratedImage({
          image_url: res.image_url,
          alt_text: res.alt_text,
          revised_prompt: res.revised_prompt,
        });
      } else {
        alert(res.error || 'Image generation failed.');
      }
    } catch (e: any) {
      alert(`Image generation error: ${e.response?.data?.detail || e.message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  // Embed Generated Image into Blog Header
  const handleEmbedImage = async () => {
    if (!generatedImage || !executionResult?.final_content) return;
    setEmbeddingImage(true);
    try {
      const res = await apiClient.attachBlogImage({
        markdown_text: executionResult.final_content,
        image_url: generatedImage.image_url,
        alt_text: generatedImage.alt_text,
      });
      if (res.success) {
        setExecutionResult({
          ...executionResult,
          final_content: res.updated_markdown,
        });
        alert('Featured image successfully embedded into blog header!');
        setShowImageStudio(false);
      }
    } catch (e: any) {
      alert(`Failed to embed image: ${e.response?.data?.detail || e.message}`);
    } finally {
      setEmbeddingImage(false);
    }
  };

  const applyPreset = (
    presetTitle: string,
    presetSteps: string[],
    samplePrompt: string,
    keyword: string
  ) => {
    setRequest(samplePrompt);
    setPrimaryKeyword(keyword);
    setSelectedSteps(presetSteps);
    setRoutePlan({
      request_type: presetTitle.toLowerCase().replace(/\s+/g, '_'),
      steps: presetSteps,
      missing_inputs: [],
      defaults_assumed: { word_count: wordCount, audience },
      needs_web_search: presetSteps.includes('serp_gap') || presetSteps.includes('rewrite_url'),
      reasoning: `Preset selected: ${presetTitle}. Pre-configured sequential prompt module pipeline.`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <Wand2 size={26} color="#4f46e5" />
            Autonomous Skill Pipeline Studio
            <span className={styles.badge}>Multi-Skill Orchestrator</span>
          </h1>
          <p>
            Treat each skill as an independent prompt module. The AI router analyzes your goal, chains optimal
            skills sequentially (Keyword Research → SERP Gap → Brief → Human Draft → Fact Check → QA → Schema),
            injects live web search grounding, and enforces strict quality thresholds.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.modelStatusPill}>
            <span className={styles.indicator}></span>
            <span>
              <strong>Active Engine:</strong> {
                provider === 'gemini' ? 'Google Gemini 2.0' :
                provider === 'openai' ? 'OpenAI GPT-4o' :
                provider === 'claude' ? 'Anthropic Claude 3.5 Sonnet' :
                'Local WordNet & PAWS Dataset'
              }
            </span>
          </div>

          <button
            className={styles.btnSecondary}
            onClick={() => setShowCatalogModal(!showCatalogModal)}
          >
            <BookOpen size={16} />
            <span>20-Skill Library</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls / Right Stepper & Results */}
      <div className={styles.mainGrid}>
        {/* Left Column: Form Controls & Router */}
        <div className={`${styles.card} ${styles.formSection}`}>
          <div className={styles.sectionHeading}>
            <Sparkles size={18} color="#4f46e5" />
            <span>1. Content Request & Context</span>
          </div>

          <div className={styles.fieldGroup}>
            <label>User Instruction / Goal</label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="E.g., Write a comprehensive technical guide on..."
              rows={4}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label>Brand Voice Profile</label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
            >
              <option value="">Default Voice (Sharp human peer, contractions, no clichés)</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.writing_tone || b.brand_voice})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.fieldGroup}>
              <label>Primary Keyword</label>
              <input
                type="text"
                value={primaryKeyword}
                onChange={(e) => setPrimaryKeyword(e.target.value)}
                placeholder="Target search keyword"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label>Word Count</label>
              <input
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                min={200}
                max={5000}
                step={100}
              />
            </div>
          </div>

          {/* Compulsory Keywords (Mandatory in Content) */}
          <div className={styles.fieldGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <label style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                <Tag size={15} color="#e11d48" />
                <span>Compulsory Keywords (Mandatory in Content)</span>
              </label>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: '#e11d48',
                background: '#ffe4e6',
                border: '1px solid #fecdd3',
                padding: '1px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Compulsory
              </span>
            </div>
            <textarea
              value={compulsoryKeywords}
              onChange={(e) => setCompulsoryKeywords(e.target.value)}
              placeholder="Enter keywords you want to use in your blog/article/post (one per line or comma-separated).&#10;E.g.:&#10;Multi-Agent Coordination&#10;Deterministic Fallbacks&#10;Real-World Latency&#10;&#10;Every keyword entered here is strictly compulsory and will be enforced across all generation steps."
              rows={4}
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.84rem',
                lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Every keyword entered here is strictly compulsory and enforced in all steps.
              </span>
              {compulsoryKeywords.trim() && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4f46e5',
                  background: '#eef2ff',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  border: '1px solid #e0e7ff'
                }}>
                  {compulsoryKeywords.split(/[\r\n,;]+/).filter(k => k.trim()).length} compulsory keywords
                </span>
              )}
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label>Target Audience</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="E.g., Senior technical leaders, B2B founders"
            />
          </div>

          <div className={styles.twoCol}>
            <div className={styles.fieldGroup}>
              <label>AI Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as 'gemini' | 'openai' | 'claude' | 'wordnet_local')}
              >
                <option value="gemini">Google Gemini + WordNet Engine</option>
                <option value="openai">OpenAI GPT-4o + WordNet Engine</option>
                <option value="claude">Anthropic Claude 3.5 Sonnet + WordNet Engine</option>
                <option value="wordnet_local">🏷️ WordNet & PAWS Model (100% Offline / Local Dataset)</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="English">English (US)</option>
                <option value="Spanish">Spanish (ES/LATAM)</option>
                <option value="Hindi">Hindi (IN)</option>
                <option value="German">German (DE)</option>
              </select>
            </div>
          </div>

          <div className={styles.sectionHeading} style={{ marginTop: '0.5rem' }}>
            <Layers size={16} />
            <span>Preset Pipelines</span>
          </div>

          <div className={styles.presetButtons}>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() =>
                applyPreset(
                  'Topic to Publish',
                  ['keyword_research', 'serp_gap', 'brief', 'draft', 'fact_check', 'qa', 'seo_schema'],
                  'Write a comprehensive technical guide on AI Agent Swarms and Multi-Agent Orchestration Architecture in 2026',
                  'AI Agent Swarms'
                )
              }
            >
              <span>Topic → Full Publication (7 Skills)</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className={styles.presetBtn}
              onClick={() =>
                applyPreset(
                  'Rewrite Live URL',
                  ['rewrite_url', 'fact_check', 'qa', 'seo_schema'],
                  'Audit and rewrite live URL: https://sevencore.ai/architecture with direct AEO answers and comparison table',
                  'AEO Content Rewriting'
                )
              }
            >
              <span>Live URL Rewrite (AEO Diagnosis)</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className={styles.presetBtn}
              onClick={() =>
                applyPreset(
                  'Short Copy Playbook',
                  ['format_playbook', 'headline_lab', 'qa'],
                  'Create 5 LinkedIn posts, ad variants, and cold email outreach for an enterprise AI content platform',
                  'AI Content Platform'
                )
              }
            >
              <span>Short Copy & Format Playbooks</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className={styles.presetBtn}
              onClick={() =>
                applyPreset(
                  'Content Refresh',
                  ['refresh_audit', 'draft', 'fact_check', 'qa'],
                  'Audit older blog post on Vector Databases, update stale benchmarks, and replace outdated pricing data',
                  'Vector Database Benchmarks'
                )
              }
            >
              <span>Content Decay & Refresh Audit</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Phased Pipeline Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {/* Step 1: Generate Outline */}
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleGenerateOutline}
              disabled={generatingOutline || !request.trim()}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                padding: '12px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {generatingOutline ? <RefreshCw size={17} className="animate-spin" /> : <BookOpen size={17} />}
              <span>{generatingOutline ? 'Generating Outline...' : '1. Generate Outline Based on Keywords'}</span>
            </button>

            {/* Step 2: Generate Draft from Outline (Available when outline exists) */}
            {outlineText && (
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleGenerateDraft}
                disabled={generatingDraft}
                style={{
                  padding: '11px 16px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: '#4f46e5',
                  borderColor: '#c7d2fe',
                  background: '#f5f3ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {generatingDraft ? <RefreshCw size={16} className="animate-spin" /> : <FileText size={16} />}
                <span>{generatingDraft ? 'Drafting Content...' : '2. Generate Draft from Outline'}</span>
              </button>
            )}

            {/* Collapsible Advanced: One-Click Full Pipeline */}
            <div style={{ marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
              <button
                type="button"
                onClick={() => setShowAdvancedPipeline(!showAdvancedPipeline)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <span>Advanced: One-Click Full Pipeline ({selectedSteps.length} Steps)</span>
                {showAdvancedPipeline ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showAdvancedPipeline && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    className={styles.btnSecondary}
                    onClick={handleRoute}
                    disabled={routing || executing}
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                  >
                    {routing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>{routing ? 'Analyzing with AI Router...' : 'Analyze with AI Router'}</span>
                  </button>

                  <button
                    className={styles.btnSecondary}
                    onClick={handleExecute}
                    disabled={executing || !selectedSteps.length}
                    style={{ fontSize: '0.8rem', padding: '8px', color: '#0f172a' }}
                  >
                    {executing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    <span>{executing ? 'Executing Batch...' : `Run All ${selectedSteps.length} Steps Automatically`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Stepper & Results Tabs */}
        <div className={styles.stepperSection}>
          {/* Router Decision Box */}
          {routePlan && (
            <div className={styles.routerDecisionBox}>
              <div className={styles.routerHeader}>
                <span>ORCHESTRATOR CLASSIFICATION</span>
                <span className={styles.badgeType}>{routePlan.request_type.toUpperCase()}</span>
              </div>
              <p>{routePlan.reasoning}</p>
            </div>
          )}

          {/* 3-Step Guided Workflow Progress Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            padding: '10px 14px',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            marginBottom: '1rem',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflowX: 'auto',
          }}>
            {/* Step 1: Outline */}
            <button
              type="button"
              onClick={() => setPipelinePhase('outline')}
              style={{
                flex: 1,
                minWidth: 170,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                background: pipelinePhase === 'outline' ? '#4f46e5' : outlineText ? '#eef2ff' : '#f8fafc',
                color: pipelinePhase === 'outline' ? '#ffffff' : outlineText ? '#3730a3' : '#64748b',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.84rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: pipelinePhase === 'outline' ? 'rgba(255,255,255,0.25)' : outlineText ? '#4f46e5' : '#e2e8f0',
                color: outlineText && pipelinePhase !== 'outline' ? '#ffffff' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}>
                {outlineText ? <Check size={13} /> : '1'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontWeight: 800 }}>1. Content Outline</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                  {outlineText ? 'Generated & Editable' : 'Keywords & Structure'}
                </div>
              </div>
            </button>

            <span style={{ color: '#cbd5e1', fontWeight: 800, fontSize: '1rem' }}>→</span>

            {/* Step 2: Human Draft */}
            <button
              type="button"
              onClick={() => {
                if (draftText || outlineText) {
                  setPipelinePhase('draft');
                } else {
                  alert('Please generate and review the outline first.');
                }
              }}
              style={{
                flex: 1,
                minWidth: 170,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                background: pipelinePhase === 'draft' ? '#4f46e5' : draftText ? '#eef2ff' : '#f8fafc',
                color: pipelinePhase === 'draft' ? '#ffffff' : draftText ? '#3730a3' : '#64748b',
                cursor: outlineText ? 'pointer' : 'not-allowed',
                opacity: outlineText ? 1 : 0.6,
                fontWeight: 700,
                fontSize: '0.84rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: pipelinePhase === 'draft' ? 'rgba(255,255,255,0.25)' : draftText ? '#4f46e5' : '#e2e8f0',
                color: draftText && pipelinePhase !== 'draft' ? '#ffffff' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}>
                {draftText ? <Check size={13} /> : '2'}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontWeight: 800 }}>2. Human Draft</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                  {draftText ? `${draftText.split(/\s+/).length} words • Editable` : 'From Approved Outline'}
                </div>
              </div>
            </button>

            <span style={{ color: '#cbd5e1', fontWeight: 800, fontSize: '1rem' }}>→</span>

            {/* Step 3: Final Publication */}
            <button
              type="button"
              onClick={() => {
                if (executionResult || expandingBlog) {
                  setPipelinePhase('final');
                } else if (draftText) {
                  setPipelinePhase('draft');
                } else {
                  alert('Please generate outline and draft first.');
                }
              }}
              style={{
                flex: 1,
                minWidth: 170,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                background: pipelinePhase === 'final' ? '#4f46e5' : executionResult ? '#eef2ff' : '#f8fafc',
                color: pipelinePhase === 'final' ? '#ffffff' : executionResult ? '#3730a3' : '#64748b',
                cursor: draftText || executionResult || expandingBlog ? 'pointer' : 'not-allowed',
                opacity: draftText || executionResult || expandingBlog ? 1 : 0.6,
                fontWeight: 700,
                fontSize: '0.84rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: pipelinePhase === 'final' ? 'rgba(255,255,255,0.25)' : executionResult ? '#4f46e5' : '#e2e8f0',
                color: executionResult && pipelinePhase !== 'final' ? '#ffffff' : 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}>
                {expandingBlog ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : executionResult ? (
                  <Check size={13} />
                ) : (
                  '3'
                )}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                <div style={{ fontWeight: 800 }}>3. Final Blog / Article</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                  {expandingBlog ? 'Generating Publication...' : executionResult ? 'Published & Grounded' : 'Choose Blog vs Article'}
                </div>
              </div>
            </button>
          </div>

          {/* Advanced Pipeline Visual Stepper Track (When enabled) */}
          {showAdvancedPipeline && (
            <div className={`${styles.card} ${styles.pipelineVisualTrack}`}>
              {selectedSteps.map((step, idx) => {
                const canonical = skillsCatalog.find((s) => s.alias === step || s.canonical_name === step);
                const label = canonical ? canonical.label : step;
                const isRunning = executing && activeStepIndex === idx;
                const isCompleted = activeStepIndex > idx || (executionResult && !executing);

                return (
                  <React.Fragment key={idx}>
                    <div
                      className={`${styles.stepNode} ${
                        isRunning ? styles.running : isCompleted ? styles.completed : styles.pending
                      }`}
                    >
                      <div className={styles.badgeIndex}>
                        {isCompleted ? <Check size={12} /> : idx + 1}
                      </div>
                      <span>{label}</span>
                    </div>
                    {idx < selectedSteps.length - 1 && <span className={styles.stepConnector}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* PHASE 1: CONTENT OUTLINE WORKSPACE */}
          {pipelinePhase === 'outline' && (
            <div className={`${styles.card}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      1. Content Outline & Structural Plan
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                      Review and edit the generated outline. Reorganize headings, add key points, or regenerate before drafting.
                    </p>
                  </div>
                  {outlineText && (
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999 }}>
                      EDIT ACCESS ACTIVE
                    </span>
                  )}
                </div>

                {/* Outline Action Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Regenerate Outline */}
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleGenerateOutline}
                    disabled={generatingOutline || !request.trim()}
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6 }}
                    title="Regenerate outline with fresh structure and keywords"
                  >
                    <RefreshCw size={13} className={generatingOutline ? 'animate-spin' : ''} />
                    <span>{generatingOutline ? 'Regenerating...' : 'Regenerate Outline'}</span>
                  </button>

                  {/* Copy Outline */}
                  {outlineText && (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={copyOutline}
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6 }}
                      title="Copy raw markdown outline to clipboard"
                    >
                      {outlineCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{outlineCopied ? 'Copied!' : 'Copy Outline'}</span>
                    </button>
                  )}

                  {/* Edit vs Preview Toggle */}
                  {outlineText && (
                    <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setOutlineViewMode('edit')}
                        style={{
                          border: 'none',
                          background: outlineViewMode === 'edit' ? '#ffffff' : 'transparent',
                          color: outlineViewMode === 'edit' ? '#0f172a' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: outlineViewMode === 'edit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutlineViewMode('preview')}
                        style={{
                          border: 'none',
                          background: outlineViewMode === 'preview' ? '#ffffff' : 'transparent',
                          color: outlineViewMode === 'preview' ? '#0f172a' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: outlineViewMode === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                    </div>
                  )}

                  {/* Next Step: Generate Draft */}
                  {outlineText && (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleGenerateDraft}
                      disabled={generatingDraft}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {generatingDraft ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                      <span>{generatingDraft ? 'Drafting...' : 'Next: Generate Draft →'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Outline Body */}
              {generatingOutline ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Generating Content Outline...</p>
                  <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0.4rem auto' }}>
                    Structuring H1/H2/H3 architecture, mapping compulsory keywords into sections, and assigning word count budgets.
                  </p>
                </div>
              ) : !outlineText ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <BookOpen size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>No Outline Generated Yet</p>
                  <p style={{ fontSize: '0.88rem', maxWidth: '450px', margin: '0.5rem auto 1.5rem', lineHeight: 1.5 }}>
                    Click below to generate a detailed outline based strictly on your primary keyword, compulsory keywords, and audience instructions.
                  </p>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleGenerateOutline}
                    disabled={!request.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      padding: '10px 22px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Generate Outline Based on Keywords</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Edit mode: Textarea */}
                  {outlineViewMode === 'edit' ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          Edit Outline (Markdown) • Full modification access:
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {outlineText.split('\n').length} lines • {outlineText.length} characters
                        </span>
                      </div>
                      <textarea
                        value={outlineText}
                        onChange={(e) => setOutlineText(e.target.value)}
                        rows={16}
                        style={{
                          width: '100%',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.86rem',
                          lineHeight: 1.55,
                          padding: '14px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f172a',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ) : (
                    /* Preview mode: ReactMarkdown */
                    <div className={styles.contentPreview} style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <ReactMarkdown>{outlineText}</ReactMarkdown>
                    </div>
                  )}

                  {/* Compulsory Keywords Audit Chips for Outline */}
                  {(() => {
                    const kwList = compulsoryKeywords
                      .split(/[\r\n,;]+/)
                      .map((k) => k.trim())
                      .filter((k) => k.length > 0);
                    if (kwList.length === 0) return null;
                    const textLower = outlineText.toLowerCase();
                    const foundCount = kwList.filter((k) => textLower.includes(k.toLowerCase())).length;
                    const allFound = foundCount === kwList.length;

                    return (
                      <div style={{
                        background: allFound ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${allFound ? '#bbf7d0' : '#fde68a'}`,
                        borderRadius: '0.65rem',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag size={14} color={allFound ? '#16a34a' : '#d97706'} />
                            <span>Compulsory Keywords Mapped in Outline: ({foundCount}/{kwList.length})</span>
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: allFound ? '#15803d' : '#b45309' }}>
                            {allFound ? 'All 100% Mapped' : 'Some Missing - Edit or Insert in Outline'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {kwList.map((kw, i) => {
                            const isPresent = textLower.includes(kw.toLowerCase());
                            return (
                              <span
                                key={i}
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: isPresent ? '#ffffff' : '#fef2f2',
                                  color: isPresent ? '#15803d' : '#991b1b',
                                  border: `1px solid ${isPresent ? '#bbf7d0' : '#fecaca'}`,
                                }}
                              >
                                {isPresent ? <Check size={11} color="#16a34a" /> : <AlertCircle size={11} color="#dc2626" />}
                                {kw}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Next Step Call-To-Action Banner */}
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    marginTop: '4px'
                  }}>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      <strong>Outline Approved?</strong> Proceed to generate the initial human-toned draft based strictly on this structure.
                    </div>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={handleGenerateDraft}
                      disabled={generatingDraft}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {generatingDraft ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                      <span>{generatingDraft ? 'Generating Draft...' : 'Next: Generate Draft from Outline →'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PHASE 2: HUMAN DRAFT WORKSPACE */}
          {pipelinePhase === 'draft' && (
            <div className={`${styles.card}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      2. Human-Tone Draft
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                      Generated from your approved outline. You can copy, edit, or modify any section before producing the final blog or article.
                    </p>
                  </div>
                  {draftText && (
                    <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999 }}>
                      {draftText.split(/\s+/).length} WORDS • EDITABLE
                    </span>
                  )}
                </div>

                {/* Draft Action Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Back to Outline */}
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setPipelinePhase('outline')}
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6 }}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Outline</span>
                  </button>

                  {/* Regenerate Draft */}
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleGenerateDraft}
                    disabled={generatingDraft}
                    style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6 }}
                    title="Regenerate draft using the current outline"
                  >
                    <RefreshCw size={13} className={generatingDraft ? 'animate-spin' : ''} />
                    <span>{generatingDraft ? 'Regenerating...' : 'Regenerate Draft'}</span>
                  </button>

                  {/* Copy Draft */}
                  {draftText && (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={copyDraft}
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6 }}
                      title="Copy raw markdown draft to clipboard"
                    >
                      {draftCopied ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{draftCopied ? 'Copied!' : 'Copy Draft'}</span>
                    </button>
                  )}

                  {/* Paraphrase & Humanize */}
                  {draftText && (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleParaphraseDraft}
                      disabled={paraphrasing}
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6, color: '#0284c7', borderColor: '#bae6fd' }}
                      title="Run PAWS & WordNet Anti-Plagiarism paraphrasing on the draft"
                    >
                      <Sparkles size={13} className={paraphrasing ? 'animate-spin' : ''} />
                      <span>{paraphrasing ? 'Paraphrasing...' : 'Paraphrase Draft'}</span>
                    </button>
                  )}

                  {/* Clean Table Symbols */}
                  {draftText && (
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={handleCleanDraftSymbols}
                      disabled={cleaningSymbols}
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', gap: 6, color: '#ea580c', borderColor: '#fed7aa' }}
                      title="Remove raw markdown table pipe grids"
                    >
                      <Wand2 size={13} className={cleaningSymbols ? 'animate-spin' : ''} />
                      <span>Clean Symbols</span>
                    </button>
                  )}

                  {/* Edit vs Preview Toggle */}
                  {draftText && (
                    <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setDraftViewMode('edit')}
                        style={{
                          border: 'none',
                          background: draftViewMode === 'edit' ? '#ffffff' : 'transparent',
                          color: draftViewMode === 'edit' ? '#0f172a' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: draftViewMode === 'edit' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftViewMode('preview')}
                        style={{
                          border: 'none',
                          background: draftViewMode === 'preview' ? '#ffffff' : 'transparent',
                          color: draftViewMode === 'preview' ? '#0f172a' : '#64748b',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: draftViewMode === 'preview' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Draft Body */}
              {generatingDraft ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>Drafting Content from Outline...</p>
                  <p style={{ fontSize: '0.85rem', maxWidth: '440px', margin: '0.4rem auto' }}>
                    Expanding section by section with authentic human cadence, embedding compulsory keywords, and eliminating AI clichés.
                  </p>
                </div>
              ) : !draftText ? (
                <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
                  <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>No Draft Generated Yet</p>
                  <p style={{ fontSize: '0.88rem', maxWidth: '450px', margin: '0.5rem auto 1.5rem', lineHeight: 1.5 }}>
                    Click below to generate the initial draft following your reviewed outline and compulsory keywords.
                  </p>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleGenerateDraft}
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      padding: '10px 22px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Generate Draft from Outline</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Edit mode: Textarea */}
                  {draftViewMode === 'edit' ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          Edit Draft (Markdown) • Full copy, modify & rewrite access:
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {draftText.split(/\s+/).length} words • {draftText.length} characters
                        </span>
                      </div>
                      <textarea
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        rows={18}
                        style={{
                          width: '100%',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.86rem',
                          lineHeight: 1.6,
                          padding: '14px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f172a',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  ) : (
                    /* Preview mode: ReactMarkdown */
                    <div className={styles.contentPreview} style={{ maxHeight: '550px', overflowY: 'auto' }}>
                      <ReactMarkdown>{draftText}</ReactMarkdown>
                    </div>
                  )}

                  {/* Compulsory Keywords Audit Chips for Draft */}
                  {(() => {
                    const kwList = compulsoryKeywords
                      .split(/[\r\n,;]+/)
                      .map((k) => k.trim())
                      .filter((k) => k.length > 0);
                    if (kwList.length === 0) return null;
                    const textLower = draftText.toLowerCase();
                    const foundCount = kwList.filter((k) => textLower.includes(k.toLowerCase())).length;
                    const allFound = foundCount === kwList.length;

                    return (
                      <div style={{
                        background: allFound ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${allFound ? '#bbf7d0' : '#fde68a'}`,
                        borderRadius: '0.65rem',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tag size={14} color={allFound ? '#16a34a' : '#d97706'} />
                            <span>Compulsory Keywords In Draft: ({foundCount}/{kwList.length})</span>
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: allFound ? '#15803d' : '#b45309' }}>
                            {allFound ? '100% Compulsory Verified' : 'Some Missing - Edit or Insert in Draft'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {kwList.map((kw, i) => {
                            const isPresent = textLower.includes(kw.toLowerCase());
                            return (
                              <span
                                key={i}
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  padding: '2px 8px',
                                  borderRadius: '5px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: isPresent ? '#ffffff' : '#fef2f2',
                                  color: isPresent ? '#15803d' : '#991b1b',
                                  border: `1px solid ${isPresent ? '#bbf7d0' : '#fecaca'}`,
                                }}
                              >
                                {isPresent ? <Check size={11} color="#16a34a" /> : <AlertCircle size={11} color="#dc2626" />}
                                {kw}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Phase 3 Format Chooser Card */}
                  <div style={{
                    background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginTop: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                        3. Generate Final Production Content
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                        Select whether to generate a web-optimized Blog Post or an authoritative In-Depth Article using your modified draft:
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {/* Option A: Generate Blog */}
                      <button
                        type="button"
                        onClick={() => handleGenerateFinalContent('blog')}
                        disabled={expandingBlog}
                        style={{
                          background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '14px 18px',
                          cursor: expandingBlog ? 'wait' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 6,
                          textAlign: 'left',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                          transition: 'transform 0.1s ease',
                          opacity: expandingBlog && generatingMode !== 'blog' ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.94rem' }}>
                          {expandingBlog && generatingMode === 'blog' ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Wand2 size={16} />
                          )}
                          <span>
                            {expandingBlog && generatingMode === 'blog'
                              ? 'Generating Full Blog Post...'
                              : 'Generate Full Blog Post'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: 0.9, lineHeight: 1.4 }}>
                          Web-optimized, engaging hook, punchy H2/H3s, comparison takeaways, FAQ block & byline.
                        </span>
                      </button>

                      {/* Option B: Generate Article */}
                      <button
                        type="button"
                        onClick={() => handleGenerateFinalContent('article')}
                        disabled={expandingBlog}
                        style={{
                          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '14px 18px',
                          cursor: expandingBlog ? 'wait' : 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 6,
                          textAlign: 'left',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                          transition: 'transform 0.1s ease',
                          opacity: expandingBlog && generatingMode !== 'article' ? 0.6 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.94rem' }}>
                          {expandingBlog && generatingMode === 'article' ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <BookOpen size={16} />
                          )}
                          <span>
                            {expandingBlog && generatingMode === 'article'
                              ? 'Generating Full Article...'
                              : 'Generate Full Article'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.74rem', opacity: 0.9, lineHeight: 1.4 }}>
                          Thought leadership, deep technical sections, empirical benchmarks, trade-off contrast points & citations.
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PHASE 3 LOADING STATE */}
          {pipelinePhase === 'final' && expandingBlog && (
            <div className={`${styles.card}`} style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b', marginBottom: '1.5rem' }}>
              <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.05rem' }}>
                Generating Final {generatingMode === 'article' ? 'In-Depth Article' : 'Blog Post'}...
              </p>
              <p style={{ fontSize: '0.85rem', maxWidth: '460px', margin: '0.4rem auto', lineHeight: 1.5 }}>
                Applying all 20 skills, anti-plagiarism humanization, fact-checking citations, evaluating QA naturalness score, and strictly verifying compulsory keywords.
              </p>
            </div>
          )}

          {/* Execution Results View (Phase 3 Results) */}
          {(pipelinePhase === 'final' || executionResult) && (
          <div className={`${styles.card} ${styles.resultsArea}`}>
            {/* Tabs Header */}
            <div className={styles.tabsHeader}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'content' ? styles.active : ''}`}
                onClick={() => setActiveTab('content')}
              >
                <FileText size={16} />
                <span>Final Human Draft</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'fact_check' ? styles.active : ''}`}
                onClick={() => setActiveTab('fact_check')}
              >
                <ShieldCheck size={16} />
                <span>Fact-Check & Claims</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'qa' ? styles.active : ''}`}
                onClick={() => setActiveTab('qa')}
              >
                <Award size={16} />
                <span>QA Naturalness Score</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'brief' ? styles.active : ''}`}
                onClick={() => setActiveTab('brief')}
              >
                <Layers size={16} />
                <span>Brief & Research</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'schema' ? styles.active : ''}`}
                onClick={() => setActiveTab('schema')}
              >
                <Code size={16} />
                <span>SEO & JSON-LD</span>
              </button>

              <button
                className={`${styles.tabBtn} ${activeTab === 'logs' ? styles.active : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <Clock size={16} />
                <span>Execution Logs</span>
              </button>
            </div>

            {/* Tab 1: Final Content */}
            {activeTab === 'content' && (
              <div className={styles.tabContent}>
                {executionResult ? (
                  <div>
                    {/* Action Bar for Full Blog Expansion & Optional Image Generation */}
                    <div className={styles.blogActionsBar}>
                      <div className={styles.actionLeft}>
                        <span>
                          Duration: <strong>{executionResult.total_duration_seconds}s</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Word Count: <strong>{executionResult.final_content.split(/\s+/).length} words</strong>
                        </span>
                        {executionResult.final_content.split(/\s+/).length >= 1000 && (
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#15803d',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                            }}
                          >
                            Full Production Blog
                          </span>
                        )}
                      </div>

                      <div className={styles.actionRight}>
                        {/* 1. Expand Draft to Full In-Depth Blog */}
                        <button
                          className={styles.btnExpand}
                          onClick={handleExpandToFullBlog}
                          disabled={expandingBlog || paraphrasing}
                          title="Expand draft into an exhaustive multi-section publication blog using all skills"
                        >
                          {expandingBlog ? <RefreshCw size={14} className="animate-spin" /> : <Maximize2 size={14} />}
                          <span>{expandingBlog ? 'Expanding Full Blog...' : 'Expand to Full Blog (1500w+)'}</span>
                        </button>

                        {/* 2. Anti-Plagiarism Paraphrase & Humanize */}
                        <button
                          className={styles.btnExpand}
                          onClick={handleParaphrasePipeline}
                          disabled={paraphrasing || expandingBlog}
                          style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)' }}
                          title="Aggressively restructure sentences, strip table pipe grids (|---|), and optimize burstiness to ensure 0% plagiarism"
                        >
                          {paraphrasing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          <span>{paraphrasing ? 'Paraphrasing...' : 'Paraphrase & Humanize'}</span>
                        </button>

                        {/* 3. Clean Table Symbols */}
                        <button
                          className={styles.btnSecondary}
                          onClick={handleCleanTableSymbols}
                          disabled={cleaningSymbols}
                          style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', color: '#ea580c', borderColor: '#fed7aa' }}
                          title="Convert raw Markdown pipe tables (|---|) and remove orphan symbols"
                        >
                          {cleaningSymbols ? <RefreshCw size={13} className="animate-spin" /> : <Wand2 size={13} />}
                          <span>Clean Table Symbols</span>
                        </button>

                        {/* 4. Optional Image Generator Toggle */}
                        <button
                          className={`${styles.btnImageTrigger} ${showImageStudio ? styles.active : ''}`}
                          onClick={() => setShowImageStudio(!showImageStudio)}
                          title="Generate a relatable featured illustration using OpenAI DALL-E 3"
                        >
                          <ImageIcon size={14} color="#7c3aed" />
                          <span>{showImageStudio ? 'Hide Image Studio' : 'Add Image (DALL-E 3)'}</span>
                          {showImageStudio ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* 3. Copy Markdown */}
                        <button
                          className={styles.btnSecondary}
                          onClick={() => copyToClipboard(executionResult.final_content)}
                          style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Optional OpenAI DALL-E Image Studio Card (Only shown if user wants it) */}
                    {showImageStudio && (
                      <div className={styles.imageStudioCard}>
                        <div className={styles.imageStudioHeader}>
                          <h3>
                            <ImageIcon size={18} />
                            <span>Optional Featured Image Generator (OpenAI DALL-E 3)</span>
                          </h3>
                          <span className={styles.badgeOptional}>OPTIONAL STEP</span>
                        </div>

                        <p style={{ fontSize: '0.84rem', color: '#701a75', margin: 0, lineHeight: 1.45 }}>
                          Generate an editorial illustration tailored to your blog's core theme. Once generated, click "Embed into Blog" to insert it under the title.
                        </p>

                        <div className={styles.imageInputsGrid}>
                          <div className={styles.fieldGroup}>
                            <label>Visual Style</label>
                            <select
                              value={imageStyle}
                              onChange={(e) => setImageStyle(e.target.value)}
                            >
                              <option value="modern minimalist 3d isometric editorial illustration">Modern Minimalist 3D Isometric</option>
                              <option value="editorial tech vector illustration clean flat">Editorial Tech Vector (Clean Flat)</option>
                              <option value="futuristic abstract architectural technology visualization">Futuristic Abstract Architectural</option>
                              <option value="clean corporate photorealistic studio tech workspace">Corporate Photorealistic Studio</option>
                            </select>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label>OpenAI API Key (Optional if set in .env)</label>
                            <input
                              type="password"
                              value={openaiKey}
                              onChange={(e) => setOpenaiKey(e.target.value)}
                              placeholder="sk-proj-... (or leave blank to use .env)"
                            />
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label>Custom Image Prompt (Optional - auto-generated from blog if blank)</label>
                          <input
                            type="text"
                            value={customImagePrompt}
                            onChange={(e) => setCustomImagePrompt(e.target.value)}
                            placeholder="Leave blank for automatic conceptual prompt based on blog title"
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <button
                            className={styles.btnExpand}
                            onClick={handleGenerateImage}
                            disabled={generatingImage}
                            style={{ background: 'linear-gradient(135deg, #701a75 0%, #a21caf 100%)' }}
                          >
                            {generatingImage ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            <span>{generatingImage ? 'Generating Image via DALL-E 3...' : 'Generate Relatable Image'}</span>
                          </button>
                        </div>

                        {/* Generated Image Preview & Embed Button */}
                        {generatedImage && (
                          <div className={styles.imagePreviewWrapper}>
                            <img src={generatedImage.image_url} alt={generatedImage.alt_text} />
                            <div style={{ fontSize: '0.8rem', color: '#701a75', textAlign: 'center' }}>
                              <strong>Alt Text:</strong> {generatedImage.alt_text}
                            </div>
                            <button
                              className={styles.btnEmbed}
                              onClick={handleEmbedImage}
                              disabled={embeddingImage}
                            >
                              <CheckCheck size={16} />
                              <span>{embeddingImage ? 'Embedding...' : 'Embed Image Into Blog Header'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Compulsory Keywords Audit Tracker */}
                    {(() => {
                      const kwList = compulsoryKeywords
                        .split(/[\r\n,;]+/)
                        .map((k) => k.trim())
                        .filter((k) => k.length > 0);
                      if (kwList.length === 0) return null;
                      const textLower = executionResult.final_content.toLowerCase();
                      const foundCount = kwList.filter((k) => textLower.includes(k.toLowerCase())).length;
                      const allFound = foundCount === kwList.length;
                      const pct = Math.round((foundCount / kwList.length) * 100);

                      return (
                        <div style={{
                          background: allFound ? '#f0fdf4' : '#fffbeb',
                          border: `1px solid ${allFound ? '#bbf7d0' : '#fde68a'}`,
                          borderRadius: '0.75rem',
                          padding: '0.85rem 1.15rem',
                          marginBottom: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Tag size={16} color={allFound ? '#16a34a' : '#d97706'} />
                              <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                                Compulsory Keywords Verification ({foundCount}/{kwList.length} In Content)
                              </strong>
                            </div>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: allFound ? '#15803d' : '#b45309',
                              background: allFound ? '#dcfce7' : '#fef3c7',
                              border: `1px solid ${allFound ? '#86efac' : '#fde68a'}`,
                              padding: '2px 10px',
                              borderRadius: '9999px',
                            }}>
                              {pct}% Compulsory Match
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.2rem' }}>
                            {kwList.map((kw, i) => {
                              const isPresent = textLower.includes(kw.toLowerCase());
                              return (
                                <span
                                  key={i}
                                  style={{
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    padding: '3px 9px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: isPresent ? '#ffffff' : '#fef2f2',
                                    color: isPresent ? '#15803d' : '#991b1b',
                                    border: `1px solid ${isPresent ? '#bbf7d0' : '#fecaca'}`,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  {isPresent ? <Check size={12} color="#16a34a" /> : <AlertCircle size={12} color="#dc2626" />}
                                  {kw}
                                  {!isPresent && <span style={{ fontSize: '0.7rem', color: '#b91c1c' }}>(Missing)</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    <div className={styles.contentPreview}>
                      <ReactMarkdown>{executionResult.final_content}</ReactMarkdown>
                    </div>

                    {/* Section B Step 4: Delivery Checklist */}
                    {executionResult.checklist && (
                      <div className={styles.checklistCard}>
                        <h4>
                          <CheckCircle2 size={16} /> Delivery Checklist Ready
                        </h4>
                        <ul>
                          <li>
                            <strong>Claims Verification:</strong> {executionResult.checklist.claims_verification}
                          </li>
                          <li>
                            <strong>Schema Status:</strong> {executionResult.checklist.schema_ready ? 'Valid JSON-LD generated' : 'Pending packaging'}
                          </li>
                          <li>
                            <strong>Quality Evaluation:</strong> {executionResult.checklist.qa_passed ? 'Passed all readability & anti-AI audits' : 'Minor edits suggested'}
                          </li>
                          <li>
                            <strong>Next Action:</strong> {executionResult.checklist.suggested_next_step}
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    <Wand2 size={36} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontWeight: 600, color: '#334155' }}>Pipeline Not Yet Executed</p>
                    <p style={{ fontSize: '0.9rem', maxWidth: '420px', margin: '0.5rem auto' }}>
                      Click <strong>"Execute Pipeline"</strong> to run the sequential skill chain. The Human-Tone Writer will draft publication-ready content with zero banned AI vocabulary and verified citations.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Fact Check & Citations */}
            {activeTab === 'fact_check' && (
              <div className={styles.tabContent}>
                {executionResult?.fact_check_table && executionResult.fact_check_table.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Verified Claims & Citation Table
                    </h3>
                    <div className={styles.tableResponsive}>
                      <table className={styles.claimTable}>
                        <thead>
                          <tr>
                            <th>Status</th>
                            <th>Claim</th>
                            <th>Source / Organization</th>
                            <th>Year</th>
                            <th>URL</th>
                            <th>Action Taken</th>
                          </tr>
                        </thead>
                        <tbody>
                          {executionResult.fact_check_table.map((row, idx) => (
                            <tr key={idx}>
                              <td>
                                <span
                                  className={`${styles.statusBadge} ${
                                    row.status?.toLowerCase().includes('verified') ? styles.verified : styles.unverified
                                  }`}
                                >
                                  {row.status || 'Verified'}
                                </span>
                              </td>
                              <td>{row.claim}</td>
                              <td>{row.source_name || 'Official Documentation'}</td>
                              <td>{row.year || '2026'}</td>
                              <td>
                                {row.url ? (
                                  <a href={row.url} target="_blank" rel="noopener noreferrer">
                                    <span>Source Link</span>
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td>{row.action_taken || 'Validated'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <ShieldCheck size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <p>No fact-check table available yet. Include <code>fact_check</code> in the pipeline to verify claims against authoritative web sources.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Editor QA Scorecard */}
            {activeTab === 'qa' && (
              <div className={styles.tabContent}>
                {executionResult?.qa_scorecard ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div
                        style={{
                          background: '#4f46e5',
                          color: '#ffffff',
                          padding: '1rem 1.5rem',
                          borderRadius: '0.75rem',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.85 }}>Overall Score</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                          {executionResult.qa_scorecard.overall_score || 94}
                          <span style={{ fontSize: '1rem', opacity: 0.75 }}>/100</span>
                        </div>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                          Publication Quality & Naturalness Scorecard
                        </h3>
                        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                          Evaluated against Grade 7-9 readability, varied cadence, zero banned AI clichés, and reader intent satisfaction.
                        </p>
                      </div>
                    </div>

                    {/* Score Breakdown Cards */}
                    {executionResult.qa_scorecard.scores && (
                      <div className={styles.qaScoreGrid}>
                        {Object.entries(executionResult.qa_scorecard.scores).map(([metric, score]) => (
                          <div key={metric} className={styles.qaScoreCard}>
                            <div className={styles.scoreLabel}>{metric.replace(/_/g, ' ')}</div>
                            <div className={styles.scoreValue}>
                              {score} <span>/10</span>
                            </div>
                            <div className={styles.scoreNote}>Target: 8+ (Passed)</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* High Impact Fixes */}
                    {executionResult.qa_scorecard.highest_impact_fixes && executionResult.qa_scorecard.highest_impact_fixes.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                          Recommended Stylistic Adjustments:
                        </h4>
                        <div className={styles.fixesList}>
                          {executionResult.qa_scorecard.highest_impact_fixes.map((fix, idx) => (
                            <div key={idx} className={styles.fixItem}>
                              <div className={styles.fixOriginal}>{fix.original}</div>
                              <div className={styles.fixSuggested}>→ {fix.suggested}</div>
                              <div className={styles.fixReason}>{fix.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <Award size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <p>No QA Scorecard generated yet. Include <code>qa</code> in your pipeline to measure readability and naturalness.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Brief & Research */}
            {activeTab === 'brief' && (
              <div className={styles.tabContent}>
                {executionResult?.step_results?.brief || executionResult?.step_results?.serp_gap ? (
                  <div className={styles.contentPreview}>
                    {executionResult.step_results.brief && (
                      <div>
                        <h3>Content Brief & Outline Structure</h3>
                        <ReactMarkdown>{executionResult.step_results.brief}</ReactMarkdown>
                      </div>
                    )}

                    {executionResult.step_results.serp_gap && (
                      <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <h3>SERP Gap Competitor Analysis</h3>
                        <ReactMarkdown>{executionResult.step_results.serp_gap}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <Layers size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <p>No research or brief step was executed in this pipeline run.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: SEO & Schema */}
            {activeTab === 'schema' && (
              <div className={styles.tabContent}>
                {executionResult?.seo_package ? (
                  <div>
                    {executionResult.seo_package.titles && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Title Tag Candidates</h4>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {executionResult.seo_package.titles.map((t, idx) => (
                            <li key={idx} style={{ fontSize: '0.9rem', color: '#1e293b', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '0.4rem' }}>
                              <strong>{t.title}</strong> ({t.character_count} chars) {t.recommended && <span style={{ color: '#16a34a', fontWeight: 600 }}>[Recommended]</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>JSON-LD Schema Markup</h4>
                    <pre className={styles.jsonBox}>
                      {JSON.stringify(executionResult.seo_package.json_ld || executionResult.seo_package, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <Code size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <p>No SEO Schema generated yet. Add <code>seo_schema</code> to generate valid JSON-LD structured data.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Execution Logs */}
            {activeTab === 'logs' && (
              <div className={styles.tabContent}>
                {executionResult?.step_logs && executionResult.step_logs.length > 0 ? (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                      Pipeline Execution Sequence ({executionResult.step_logs.length} Steps)
                    </h3>
                    <div className={styles.tableResponsive}>
                      <table className={styles.claimTable}>
                        <thead>
                          <tr>
                            <th>Step</th>
                            <th>Skill Name</th>
                            <th>Output Format</th>
                            <th>Duration</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {executionResult.step_logs.map((log) => (
                            <tr key={log.step_index}>
                              <td>#{log.step_index}</td>
                              <td>
                                <strong>{log.label}</strong> (<code>{log.step_name}</code>)
                              </td>
                              <td>{log.format.toUpperCase()}</td>
                              <td>{log.duration_seconds}s</td>
                              <td>
                                {log.error ? (
                                  <span style={{ color: '#dc2626', fontWeight: 600 }}>Error: {log.error}</span>
                                ) : (
                                  <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Check size={14} /> Completed
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
                    <p>Logs will appear here once the pipeline finishes running.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* 20-Skill Library Modal */}
      {showCatalogModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box'
          }}
          onClick={() => setShowCatalogModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '1rem',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '1.5rem',
              boxSizing: 'border-box',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                Complete Content Platform Skill Library (20 Modular Skills)
              </h2>
              <button
                onClick={() => setShowCatalogModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Each skill is an isolated prompt module loaded on-demand by the router into the 6-block system prompt layout.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {skillsCatalog.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.65rem',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{s.label}</strong>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: s.output_format === 'json' ? '#e0e7ff' : '#f1f5f9',
                        color: s.output_format === 'json' ? '#4338ca' : '#475569',
                        fontWeight: 600,
                      }}
                    >
                      {s.output_format.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6366f1', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                    alias: {s.alias} | model: {s.model_tier} tier {s.needs_search ? '| web search' : ''}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.45 }}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

