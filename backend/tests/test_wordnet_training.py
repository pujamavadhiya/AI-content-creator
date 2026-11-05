import os
import json
import pytest
from pathlib import Path
from app.services.dataset_trainer_service import dataset_trainer_service
from app.services.paraphrase_service import paraphrase_service
from app.ai.skills.paws_exemplars import format_wordnet_exemplars_prompt, format_combined_training_exemplars_prompt

def test_wordnet_overview():
    overview = dataset_trainer_service.get_wordnet_overview()
    assert overview["status"] == "Available"
    assert overview["total_files"] == 8
    assert overview["total_rows"] >= 570000
    assert overview["total_size_mb"] >= 35.0
    
    filenames = [f["filename"] for f in overview["files"]]
    assert "WordnetThesaurus.csv" in filenames
    assert "WordnetSynonyms.csv" in filenames
    assert "WordnetVerbs.csv" in filenames
    assert "WordnetAdjectives.csv" in filenames

def test_wordnet_lexicon_store_build():
    res = dataset_trainer_service.build_wordnet_lexicon_store(limit=300)
    assert res["success"] is True
    assert res["total_indexed"] >= 100
    assert res["ai_cliche_targets"] >= 20
    assert os.path.exists(res["file_path"])
    
    with open(res["file_path"], "r", encoding="utf-8") as f:
        data = json.load(f)
        assert "ai_replacements" in data
        assert "utilize" in data["ai_replacements"]
        assert len(data["ai_replacements"]["utilize"]) > 0

def test_wordnet_finetune_export():
    res = dataset_trainer_service.export_wordnet_finetuning_jsonl(provider="openai", train_limit=50, val_limit=10)
    assert res["success"] is True
    assert res["train_count"] == 50
    assert res["val_count"] == 10
    assert os.path.exists(res["train_file"])
    
    # Verify JSONL lines are valid JSON
    with open(res["train_file"], "r", encoding="utf-8") as f:
        line = f.readline()
        record = json.loads(line)
        assert "messages" in record
        assert len(record["messages"]) == 3

def test_combined_overview_and_exemplars():
    combined = dataset_trainer_service.get_combined_overview()
    assert combined["total_combined_rows"] >= 680000
    assert combined["total_combined_files"] >= 12
    assert "paws" in combined
    assert "wordnet" in combined
    
    prompt = format_wordnet_exemplars_prompt(limit=3)
    assert "WORDNET LEXICAL SUBSTITUTION DIRECTIVES" in prompt
    assert "utilize / leverage" in prompt
    
    comb_prompt = format_combined_training_exemplars_prompt(paws_limit=2, wordnet_limit=2)
    assert "EXEMPLAR HUMAN PARAPHRASE PATTERNS" in comb_prompt
    assert "WORDNET LEXICAL SUBSTITUTION DIRECTIVES" in comb_prompt

