import pytest
from app.services.dataset_trainer_service import dataset_trainer_service
from app.ai.skills.paws_exemplars import format_paws_exemplars_prompt, PAWS_FEW_SHOT_EXEMPLARS

def test_paws_exemplars_module():
    assert len(PAWS_FEW_SHOT_EXEMPLARS) >= 6
    prompt_snippet = format_paws_exemplars_prompt(limit=4)
    assert "EXEMPLAR HUMAN PARAPHRASE PATTERNS" in prompt_snippet
    assert "Clause Inversion" in prompt_snippet

def test_dataset_trainer_service_overview():
    stats = dataset_trainer_service.get_dataset_overview()
    assert stats["status"] == "Available"
    assert stats["total_files"] >= 4
    assert stats["positive_paraphrases"] > 10000
    assert any(f["filename"] == "labeled_final_train.csv" for f in stats["files"])

def test_dataset_trainer_service_build_exemplars():
    res = dataset_trainer_service.build_paws_exemplar_store(limit=20)
    assert res["success"] is True
    assert res["exemplars_extracted"] == 20
    assert "paws_exemplar_store.json" in res["file_path"]

def test_dataset_trainer_service_export_finetune():
    res = dataset_trainer_service.export_finetuning_jsonl(provider="openai", train_limit=25, val_limit=10)
    assert res["success"] is True
    assert res["train_count"] == 25
    assert res["val_count"] == 10
    assert "openai_finetune_train.jsonl" in res["train_file"]

