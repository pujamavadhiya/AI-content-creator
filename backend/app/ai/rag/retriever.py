from typing import Optional, Dict, Any, List
from app.ai.providers.base import BaseAIProvider
from app.ai.rag.vector_store import vector_store

async def retrieve_context(
    query: str,
    org_id: str,
    collection_id: Optional[str],
    ai_provider: BaseAIProvider,
    top_k: int = 5,
    similarity_threshold: float = 0.4
) -> Dict[str, Any]:
    """
    RAG Retrieval Pipeline:
    1. Embed query
    2. Search Qdrant vector store with metadata filtering
    3. Assemble context and cite sources
    """
    if not collection_id:
        return {
            "has_context": False,
            "context_text": "",
            "sources": []
        }

    try:
        query_vector = await ai_provider.generate_embedding(query)
    except Exception:
        # Fallback if embedding is unavailable or mock
        return {
            "has_context": False,
            "context_text": "",
            "sources": []
        }

    chunks = await vector_store.search(
        query_vector=query_vector,
        org_id=org_id,
        collection_id=collection_id,
        top_k=top_k,
        similarity_threshold=similarity_threshold
    )

    if not chunks:
        return {
            "has_context": False,
            "context_text": "No closely matching reference passages found above similarity threshold.",
            "sources": []
        }

    context_segments = []
    sources = []
    for c in chunks:
        src_label = f"[{c['filename']} - Page {c['page_number']}]"
        context_segments.append(f"{src_label}:\n{c['text']}")
        sources.append({
            "filename": c["filename"],
            "page_number": c["page_number"],
            "score": round(c["score"], 3),
            "document_id": c["document_id"]
        })

    return {
        "has_context": True,
        "context_text": "\n\n".join(context_segments),
        "sources": sources
    }

