import os
import json
import logging
import time
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)

class DatasetTrainerService:
    """
    Manages datasets in 'LLM Model/Datasets/', extracts PAWS human paraphrase exemplars,
    prepares Supervised Fine-Tuning (SFT) JSONL datasets for OpenAI and Gemini,
    and handles model training execution.
    """

    def __init__(self, root_dir: Optional[str] = None):
        if root_dir:
            self.root_dir = Path(root_dir)
        else:
            # Resolve root directory (Sevencore AI Content Creator)
            self.root_dir = Path(__file__).resolve().parent.parent.parent.parent

        self.datasets_dir = self.root_dir / "LLM Model" / "Datasets"
        self.wordnet_dir = self.root_dir / "LLM Model" / "WordNet-DictionaryThesaurus"
        self.processed_dir = self.root_dir / "LLM Model" / "Processed"
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def clean_paws_text(self, text: str) -> str:
        """Cleans tokenized spaces and punctuation artifacts in PAWS dataset."""
        if not text or not isinstance(text, str):
            return ""
        t = text.strip()
        t = t.replace(" ,", ",").replace(" .", ".").replace(" ?", "?").replace(" !", "!")
        t = t.replace(" 's", "'s").replace(" 're", "'re").replace(" 've", "'ve").replace(" n't", "n't")
        t = t.replace(" 'm", "'m").replace(" 'll", "'ll").replace(" 'd", "'d")
        t = t.replace(" -- ", "—").replace(" - ", "-")
        t = t.replace("`` ", '"').replace(" ''", '"')
        t = t.replace(" ( ", " (").replace(" ) ", ") ")
        return t

    def get_dataset_overview(self) -> Dict[str, Any]:
        """Scans dataset directory and returns statistics on rows and paraphrase pairs."""
        stats = {
            "total_files": 0,
            "total_rows": 0,
            "positive_paraphrases": 0,
            "negative_pairs": 0,
            "files": [],
            "status": "Available",
        }

        if not self.datasets_dir.exists():
            return {
                "status": "Not Found",
                "message": f"Datasets directory not found at {self.datasets_dir}",
                "files": []
            }

        files_info = [
            ("labeled_final_train.csv", "Primary Labeled Training Set"),
            ("labeled_swap_train.csv", "Adversarial Swap Training Set"),
            ("labeled_final_validation.csv", "Validation Benchmark Set"),
            ("labeled_final_test.csv", "Held-out Test Evaluation Set"),
            ("unlabeled_final_validation.csv", "Unlabeled Validation Set"),
        ]

        for fname, desc in files_info:
            fpath = self.datasets_dir / fname
            if fpath.exists():
                size_mb = round(fpath.stat().st_size / (1024 * 1024), 2)
                try:
                    df = pd.read_csv(fpath)
                    row_count = len(df)
                    pos_count = int(df["label"].sum()) if "label" in df.columns else 0
                    neg_count = row_count - pos_count if "label" in df.columns else 0

                    stats["total_rows"] += row_count
                    stats["positive_paraphrases"] += pos_count
                    stats["negative_pairs"] += neg_count
                    stats["total_files"] += 1

                    stats["files"].append({
                        "filename": fname,
                        "description": desc,
                        "size_mb": size_mb,
                        "row_count": row_count,
                        "positive_paraphrases": pos_count,
                        "negative_pairs": neg_count,
                        "has_labels": "label" in df.columns
                    })
                except Exception as e:
                    logger.warning(f"Error inspecting {fname}: {e}")

        # Check if processed SFT files already exist
        processed_files = []
        if self.processed_dir.exists():
            for p_file in self.processed_dir.glob("*.json*"):
                processed_files.append({
                    "filename": p_file.name,
                    "size_kb": round(p_file.stat().st_size / 1024, 1),
                    "modified_time": time.ctime(p_file.stat().st_mtime)
                })

        stats["processed_artifacts"] = processed_files
        return stats

    def build_paws_exemplar_store(self, limit: int = 500) -> Dict[str, Any]:
        """
        Extracts high-diversity, cleaned positive paraphrase pairs from the PAWS dataset
        and stores them in JSON for live in-context learning.
        """
        train_csv = self.datasets_dir / "labeled_final_train.csv"
        if not train_csv.exists():
            raise FileNotFoundError(f"Training CSV not found at {train_csv}")

        df = pd.read_csv(train_csv)
        pos_df = df[df["label"] == 1]

        exemplars = []
        seen = set()

        for _, row in pos_df.iterrows():
            s1 = self.clean_paws_text(str(row["sentence1"]))
            s2 = self.clean_paws_text(str(row["sentence2"]))

            # Filter for meaningful length and distinctness
            words1 = s1.split()
            words2 = s2.split()
            if 8 <= len(words1) <= 35 and 8 <= len(words2) <= 35 and s1.lower() != s2.lower():
                key = (s1[:30], s2[:30])
                if key not in seen:
                    seen.add(key)
                    exemplars.append({
                        "original": s1,
                        "paraphrase": s2,
                        "word_count_orig": len(words1),
                        "word_count_para": len(words2)
                    })
                    if len(exemplars) >= limit:
                        break

        out_path = self.processed_dir / "paws_exemplar_store.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({
                "description": "High-Quality Human Paraphrase Exemplars extracted from PAWS for In-Context Few-Shot Learning",
                "total_exemplars": len(exemplars),
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "exemplars": exemplars
            }, f, indent=2)

        return {
            "success": True,
            "exemplars_extracted": len(exemplars),
            "file_path": str(out_path),
            "size_kb": round(out_path.stat().st_size / 1024, 1)
        }

    def export_finetuning_jsonl(
        self,
        provider: str = "openai",
        train_limit: int = 4000,
        val_limit: int = 500
    ) -> Dict[str, Any]:
        """
        Exports fine-tuning JSONL datasets formatted for OpenAI and Gemini model fine-tuning.
        """
        train_csv = self.datasets_dir / "labeled_final_train.csv"
        val_csv = self.datasets_dir / "labeled_final_validation.csv"

        if not train_csv.exists() or not val_csv.exists():
            raise FileNotFoundError("Source CSV datasets not found in LLM Model/Datasets/")

        df_train = pd.read_csv(train_csv)
        pos_train = df_train[df_train["label"] == 1].head(train_limit)

        df_val = pd.read_csv(val_csv)
        pos_val = df_val[df_val["label"] == 1].head(val_limit)

        system_prompt = (
            "You are a master human paraphrase engine. Rewrite the given text so it is completely "
            "indistinguishable from high-caliber human writing (85-95%+ human score on AI detectors). "
            "Invert clause structures, vary sentence length, eliminate AI cliches, break long sentences, "
            "use natural contractions, and preserve all factual accuracy."
        )

        provider_clean = provider.lower().strip()
        train_path = self.processed_dir / f"{provider_clean}_finetune_train.jsonl"
        val_path = self.processed_dir / f"{provider_clean}_finetune_val.jsonl"

        # Generate Train Set
        with open(train_path, "w", encoding="utf-8") as f:
            for _, r in pos_train.iterrows():
                s1 = self.clean_paws_text(str(r["sentence1"]))
                s2 = self.clean_paws_text(str(r["sentence2"]))
                if s1 and s2 and s1 != s2:
                    if provider_clean == "openai":
                        record = {
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": s1},
                                {"role": "assistant", "content": s2}
                            ]
                        }
                    else:  # gemini / vertex format
                        record = {
                            "contents": [
                                {"role": "user", "parts": [{"text": f"{system_prompt}\n\nText: {s1}"}]},
                                {"role": "model", "parts": [{"text": s2}]}
                            ]
                        }
                    f.write(json.dumps(record) + "\n")

        # Generate Val Set
        with open(val_path, "w", encoding="utf-8") as f:
            for _, r in pos_val.iterrows():
                s1 = self.clean_paws_text(str(r["sentence1"]))
                s2 = self.clean_paws_text(str(r["sentence2"]))
                if s1 and s2 and s1 != s2:
                    if provider_clean == "openai":
                        record = {
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": s1},
                                {"role": "assistant", "content": s2}
                            ]
                        }
                    else:
                        record = {
                            "contents": [
                                {"role": "user", "parts": [{"text": f"{system_prompt}\n\nText: {s1}"}]},
                                {"role": "model", "parts": [{"text": s2}]}
                            ]
                        }
                    f.write(json.dumps(record) + "\n")

        return {
            "success": True,
            "provider": provider_clean,
            "train_file": str(train_path),
            "train_count": len(pos_train),
            "train_size_kb": round(train_path.stat().st_size / 1024, 1),
            "val_file": str(val_path),
            "val_count": len(pos_val),
            "val_size_kb": round(val_path.stat().st_size / 1024, 1),
        }

    # =========================================================================
    # WordNet Dictionary & Thesaurus Methods (576,000+ Vocabulary Records)
    # =========================================================================

    def get_wordnet_overview(self) -> Dict[str, Any]:
        """Scans WordNet directory and returns statistics on rows, sizes, and vocabulary assets."""
        stats = {
            "total_files": 0,
            "total_rows": 0,
            "total_size_mb": 0.0,
            "files": [],
            "status": "Available" if self.wordnet_dir.exists() else "Not Found",
            "processed_artifacts": []
        }

        if not self.wordnet_dir.exists():
            return {
                "status": "Not Found",
                "message": f"WordNet directory not found at {self.wordnet_dir}",
                "files": []
            }

        files_info = [
            ("WordnetThesaurus.csv", "WordNet Conceptual Thesaurus & Term Associations", "Thesaurus"),
            ("WordnetSynonyms.csv", "WordNet Part-of-Speech Synonyms & Exact Equivalence", "Synonyms"),
            ("WordnetHypernyms.csv", "Hypernym Hierarchies (Broader Semantic Categories)", "Hypernyms"),
            ("WordnetNouns.csv", "Noun Definitions, Senses & Domain Classifications", "Nouns"),
            ("WordnetHyponyms.csv", "Hyponym Sub-types (Specific Semantic Instances)", "Hyponyms"),
            ("WordnetVerbs.csv", "Verb Senses, Definitions & Real Human Usage Examples", "Verbs"),
            ("WordnetAdverbs.csv", "Adverb Modifiers & Contextual Senses", "Adverbs"),
            ("WordnetAdjectives.csv", "Descriptive Adjectives & Illustrative Sentences", "Adjectives"),
        ]

        total_bytes = 0
        for fname, desc, category in files_info:
            fpath = self.wordnet_dir / fname
            if fpath.exists():
                size_bytes = fpath.stat().st_size
                size_mb = round(size_bytes / (1024 * 1024), 2)
                total_bytes += size_bytes
                try:
                    with open(fpath, "rb") as f:
                        row_count = sum(1 for _ in f) - 1
                    if row_count < 0:
                        row_count = 0

                    stats["total_rows"] += row_count
                    stats["total_files"] += 1

                    stats["files"].append({
                        "filename": fname,
                        "description": desc,
                        "category": category,
                        "size_mb": size_mb,
                        "row_count": row_count,
                    })
                except Exception as e:
                    logger.warning(f"Error inspecting WordNet {fname}: {e}")

        stats["total_size_mb"] = round(total_bytes / (1024 * 1024), 2)

        # WordNet processed artifacts
        processed_files = []
        if self.processed_dir.exists():
            for p_file in self.processed_dir.glob("*wordnet*"):
                processed_files.append({
                    "filename": p_file.name,
                    "size_kb": round(p_file.stat().st_size / 1024, 1),
                    "modified_time": time.ctime(p_file.stat().st_mtime)
                })
            for p_file in self.processed_dir.glob("*lexicon*"):
                processed_files.append({
                    "filename": p_file.name,
                    "size_kb": round(p_file.stat().st_size / 1024, 1),
                    "modified_time": time.ctime(p_file.stat().st_mtime)
                })

        stats["processed_artifacts"] = processed_files
        return stats

    def build_wordnet_lexicon_store(self, limit: int = 2500) -> Dict[str, Any]:
        """
        Extracts curated, high-utility WordNet synonym clusters and AI-cliché replacements,
        storing them in 'LLM Model/Processed/wordnet_lexicon_store.json' for runtime prompting
        and vocabulary perplexity enrichment.
        """
        if not self.wordnet_dir.exists():
            raise FileNotFoundError(f"WordNet directory not found at {self.wordnet_dir}")

        syn_csv = self.wordnet_dir / "WordnetSynonyms.csv"
        thes_csv = self.wordnet_dir / "WordnetThesaurus.csv"

        if not syn_csv.exists() or not thes_csv.exists():
            raise FileNotFoundError("WordNet CSV files not found")

        # High-priority corporate & AI words to extract first
        priority_words = [
            "utilize", "leverage", "delve", "pivotal", "seamless", "robust",
            "testament", "tapestry", "complex", "essential", "demonstrate",
            "illustrate", "transform", "optimize", "accelerate", "comprehensive",
            "crucial", "facilitate", "foster", "streamline", "vital", "prominent",
            "interconnected", "dynamic", "paramount", "innovative", "furthermore",
            "moreover", "significant", "imperative", "subsequent", "unprecedented",
            "cornerstone", "quintessential", "paradigm", "synergy", "holistic",
            "implement", "empower", "mitigate", "harness", "expedite", "elevate"
        ]

        syn_df = pd.read_csv(syn_csv)
        thes_df = pd.read_csv(thes_csv)

        # Build clean synonym dictionary
        lexicon = {}
        ai_replacements = {}

        # 1. First index priority words
        for w in priority_words:
            syn_matches = syn_df[syn_df["Word"].str.lower() == w]
            terms = set()
            if not syn_matches.empty:
                for _, row in syn_matches.iterrows():
                    raw = str(row["Synonyms"])
                    if pd.notna(raw) and raw != "nan":
                        for item in re.split(r'[;|]+', raw):
                            clean = item.strip()
                            if clean and clean.lower() != w and len(clean) > 1:
                                terms.add(clean)

            thes_matches = thes_df[thes_df["Word"].str.lower() == w]
            if not thes_matches.empty:
                row = thes_matches.iloc[0]
                for i in range(1, 8):
                    val = row.get(f"Term {i}")
                    if pd.notna(val):
                        clean = re.sub(r'\s*\([^)]*\)', '', str(val)).strip()
                        if clean and clean.lower() != w and len(clean) > 1:
                            terms.add(clean)

            if terms:
                clean_terms = sorted(list(terms))[:8]
                ai_replacements[w] = clean_terms
                lexicon[w] = {
                    "word": w,
                    "synonyms": clean_terms,
                    "pos": syn_matches.iloc[0]["POS"] if not syn_matches.empty and "POS" in syn_matches.columns else "general",
                    "is_ai_cliche_target": True
                }

        # 2. Add high-frequency vocabulary from Synonyms CSV up to limit
        added_count = 0
        for _, row in syn_df.iterrows():
            word = str(row["Word"]).strip()
            if not word or word.lower() in lexicon or len(word) < 3 or word.startswith("'") or word.startswith("."):
                continue

            raw = str(row["Synonyms"])
            if pd.isna(raw) or raw == "nan":
                continue

            syn_list = []
            for item in re.split(r'[;|]+', raw):
                clean = item.strip()
                if clean and clean.lower() != word.lower() and len(clean) > 2:
                    syn_list.append(clean)

            if syn_list:
                lexicon[word.lower()] = {
                    "word": word,
                    "synonyms": syn_list[:6],
                    "pos": str(row.get("POS", "general")),
                    "is_ai_cliche_target": False
                }
                added_count += 1
                if added_count >= limit:
                    break

        out_path = self.processed_dir / "wordnet_lexicon_store.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump({
                "description": "WordNet Synonym & Paraphrasing Lexicon Store for Vocabulary Perplexity Optimization",
                "total_entries": len(lexicon),
                "ai_cliche_targets": len(ai_replacements),
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "ai_replacements": ai_replacements,
                "lexicon": lexicon
            }, f, indent=2)

        return {
            "success": True,
            "total_indexed": len(lexicon),
            "ai_cliche_targets": len(ai_replacements),
            "file_path": str(out_path),
            "size_kb": round(out_path.stat().st_size / 1024, 1)
        }

    def export_wordnet_finetuning_jsonl(
        self,
        provider: str = "openai",
        train_limit: int = 3000,
        val_limit: int = 400
    ) -> Dict[str, Any]:
        """
        Exports fine-tuning JSONL datasets formatted for OpenAI and Gemini model fine-tuning,
        grounded in WordNet's rich example sentences and synonym substitutions.
        """
        if not self.wordnet_dir.exists():
            raise FileNotFoundError("WordNet directory not found")

        v_csv = self.wordnet_dir / "WordnetVerbs.csv"
        adj_csv = self.wordnet_dir / "WordnetAdjectives.csv"
        syn_csv = self.wordnet_dir / "WordnetSynonyms.csv"

        v_df = pd.read_csv(v_csv) if v_csv.exists() else pd.DataFrame()
        adj_df = pd.read_csv(adj_csv) if adj_csv.exists() else pd.DataFrame()
        syn_df = pd.read_csv(syn_csv) if syn_csv.exists() else pd.DataFrame()

        # Build quick synonym dictionary
        syn_dict = {}
        for _, r in syn_df.iterrows():
            w = str(r["Word"]).strip().lower()
            raw = str(r["Synonyms"])
            if pd.notna(raw) and raw != "nan":
                items = [s.strip() for s in re.split(r'[;|]+', raw) if s.strip() and s.strip().lower() != w]
                if items:
                    syn_dict[w] = items

        pairs = []
        # From verbs
        for _, r in v_df.iterrows():
            word = str(r["Word"]).strip().lower()
            definition = str(r.get("Definition", "")).strip() if pd.notna(r.get("Definition")) else ""
            for col in ["Example 1", "Example 2"]:
                ex = r.get(col)
                if pd.notna(ex) and isinstance(ex, str) and len(ex.split()) >= 4:
                    ex_clean = ex.strip().rstrip(".,")
                    syns = syn_dict.get(word, [])
                    if syns:
                        repl = syns[0]
                        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
                        if pattern.search(ex_clean):
                            paraphrased = pattern.sub(repl, ex_clean)
                            if paraphrased != ex_clean:
                                pairs.append((ex_clean, paraphrased))
                        elif definition and len(definition.split()) >= 3:
                            pairs.append((f"{ex_clean} ({definition})", f"{ex_clean} — namely, to {definition}."))

        # From adjectives
        for _, r in adj_df.iterrows():
            word = str(r["Word"]).strip().lower()
            definition = str(r.get("Definition", "")).strip() if pd.notna(r.get("Definition")) else ""
            for col in ["Example 1", "Example 2", "Example 3"]:
                ex = r.get(col)
                if pd.notna(ex) and isinstance(ex, str) and len(ex.split()) >= 4:
                    ex_clean = ex.strip().rstrip(".,")
                    syns = syn_dict.get(word, [])
                    if syns:
                        repl = syns[0]
                        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
                        if pattern.search(ex_clean):
                            paraphrased = pattern.sub(repl, ex_clean)
                            if paraphrased != ex_clean:
                                pairs.append((ex_clean, paraphrased))

        # Pad with general synonym substitutions if needed
        if len(pairs) < train_limit + val_limit:
            for w, s_list in syn_dict.items():
                if len(s_list) >= 2 and len(w) > 3:
                    s1 = f"The team decided to {w} the project to ensure successful outcomes."
                    s2 = f"The team chose to {s_list[0]} the project to guarantee strong results."
                    pairs.append((s1, s2))
                if len(pairs) >= (train_limit + val_limit) * 2:
                    break

        train_pairs = pairs[:train_limit]
        val_pairs = pairs[train_limit:train_limit + val_limit]

        system_prompt = (
            "You are a master lexical stylist and human paraphraser. Rewrite the input text using rich, varied, "
            "and natural human vocabulary derived from WordNet thesaurus patterns. Disrupt repetitive AI n-grams, "
            "substitute generic terms with precise, colorful synonyms, and ensure 85-95%+ human content authenticity."
        )

        provider_clean = provider.lower().strip()
        train_path = self.processed_dir / f"{provider_clean}_wordnet_train.jsonl"
        val_path = self.processed_dir / f"{provider_clean}_wordnet_val.jsonl"

        # Write Train JSONL
        with open(train_path, "w", encoding="utf-8") as f:
            for src, target in train_pairs:
                if provider_clean == "openai":
                    record = {
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": src},
                            {"role": "assistant", "content": target}
                        ]
                    }
                else:
                    record = {
                        "contents": [
                            {"role": "user", "parts": [{"text": f"{system_prompt}\n\nText: {src}"}]},
                            {"role": "model", "parts": [{"text": target}]}
                        ]
                    }
                f.write(json.dumps(record) + "\n")

        # Write Val JSONL
        with open(val_path, "w", encoding="utf-8") as f:
            for src, target in val_pairs:
                if provider_clean == "openai":
                    record = {
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": src},
                            {"role": "assistant", "content": target}
                        ]
                    }
                else:
                    record = {
                        "contents": [
                            {"role": "user", "parts": [{"text": f"{system_prompt}\n\nText: {src}"}]},
                            {"role": "model", "parts": [{"text": target}]}
                        ]
                    }
                f.write(json.dumps(record) + "\n")

        return {
            "success": True,
            "provider": provider_clean,
            "train_file": str(train_path),
            "train_count": len(train_pairs),
            "train_size_kb": round(train_path.stat().st_size / 1024, 1),
            "val_file": str(val_path),
            "val_count": len(val_pairs),
            "val_size_kb": round(val_path.stat().st_size / 1024, 1),
        }

    def export_combined_finetuning_jsonl(
        self,
        provider: str = "openai",
        paws_train_limit: int = 2500,
        wordnet_train_limit: int = 1500
    ) -> Dict[str, Any]:
        """
        Combines PAWS (Syntactic Inversion & Burstiness) and WordNet (Lexical Substitution & High Perplexity)
        into a unified, dual-engine fine-tuning dataset for training the ultimate humanizer model.
        """
        provider_clean = provider.lower().strip()
        paws_res = self.export_finetuning_jsonl(provider=provider_clean, train_limit=paws_train_limit, val_limit=300)
        wordnet_res = self.export_wordnet_finetuning_jsonl(provider=provider_clean, train_limit=wordnet_train_limit, val_limit=200)

        comb_train_path = self.processed_dir / f"{provider_clean}_combined_train.jsonl"
        comb_val_path = self.processed_dir / f"{provider_clean}_combined_val.jsonl"

        # Combine train
        total_train = 0
        with open(comb_train_path, "w", encoding="utf-8") as out_f:
            for src_file in [paws_res["train_file"], wordnet_res["train_file"]]:
                if Path(src_file).exists():
                    with open(src_file, "r", encoding="utf-8") as in_f:
                        for line in in_f:
                            if line.strip():
                                out_f.write(line)
                                total_train += 1

        # Combine val
        total_val = 0
        with open(comb_val_path, "w", encoding="utf-8") as out_f:
            for src_file in [paws_res["val_file"], wordnet_res["val_file"]]:
                if Path(src_file).exists():
                    with open(src_file, "r", encoding="utf-8") as in_f:
                        for line in in_f:
                            if line.strip():
                                out_f.write(line)
                                total_val += 1

        return {
            "success": True,
            "provider": provider_clean,
            "train_file": str(comb_train_path),
            "train_count": total_train,
            "train_size_kb": round(comb_train_path.stat().st_size / 1024, 1),
            "val_file": str(comb_val_path),
            "val_count": total_val,
            "val_size_kb": round(comb_val_path.stat().st_size / 1024, 1),
            "components": {
                "paws_train_records": paws_res["train_count"],
                "wordnet_train_records": wordnet_res["train_count"],
            }
        }

    def get_combined_overview(self) -> Dict[str, Any]:
        """Provides unified dataset statistics across PAWS (Syntactic) and WordNet (Lexical)."""
        paws = self.get_dataset_overview()
        wordnet = self.get_wordnet_overview()

        return {
            "total_combined_rows": paws.get("total_rows", 0) + wordnet.get("total_rows", 0),
            "total_combined_files": paws.get("total_files", 0) + wordnet.get("total_files", 0),
            "paws": paws,
            "wordnet": wordnet,
            "all_processed_artifacts": paws.get("processed_artifacts", []) + wordnet.get("processed_artifacts", [])
        }

    async def start_openai_finetune_job(
        self,
        model: str = "gpt-4o-mini-2024-07-18",
        train_file_path: Optional[str] = None,
        openai_api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads fine-tuning training file to OpenAI and launches a fine-tuning job.
        Requires an active OPENAI_API_KEY.
        """
        key = openai_api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            return {
                "success": False,
                "error": "OpenAI API key is missing. Please save your OpenAI key in Model Settings or .env first."
            }

        target_file = Path(train_file_path) if train_file_path else (self.processed_dir / "openai_finetune_train.jsonl")
        if not target_file.exists():
            # Export if not already generated
            export_res = self.export_finetuning_jsonl(provider="openai")
            target_file = Path(export_res["train_file"])

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=key)

            # 1. Upload File
            with open(target_file, "rb") as f:
                upload_res = await client.files.create(
                    file=f,
                    purpose="fine-tune"
                )

            file_id = upload_res.id
            logger.info(f"Uploaded training file to OpenAI: {file_id}")

            # 2. Create Fine-Tuning Job
            job = await client.fine_tuning.jobs.create(
                training_file=file_id,
                model=model,
                suffix="sevencore-human-paraphrase"
            )

            return {
                "success": True,
                "job_id": job.id,
                "model": model,
                "status": job.status,
                "training_file_id": file_id,
                "created_at": job.created_at,
                "message": f"Fine-tuning job started on {model}! Tracking ID: {job.id}"
            }
        except Exception as e:
            logger.error(f"Failed to start OpenAI fine-tune job: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

dataset_trainer_service = DatasetTrainerService()

