import os
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.config import settings

class QdrantVectorStore:
    def __init__(self, collection_name: str = "reference_chunks"):
        self.collection_name = collection_name
        self._client: Optional[QdrantClient] = None

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            q_url = settings.QDRANT_URL
            if q_url.startswith("http://") or q_url.startswith("https://"):
                self._client = QdrantClient(url=q_url, api_key=settings.QDRANT_API_KEY)
            elif q_url == ":memory:":
                self._client = QdrantClient(":memory:")
            else:
                os.makedirs(q_url, exist_ok=True)
                self._client = QdrantClient(path=q_url)
        return self._client

    def ensure_collection(self, vector_size: int = 768):
        """Creates collection if it does not exist."""
        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == self.collection_name for c in collections)
            if not exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=vector_size,
                        distance=qmodels.Distance.COSINE
                    )
                )
        except Exception:
            pass

    async def upsert_chunks(self, points: List[Dict[str, Any]], vector_size: int = 768):
        if not points:
            return

        if points and "vector" in points[0] and isinstance(points[0]["vector"], list):
            vector_size = len(points[0]["vector"])

        self.ensure_collection(vector_size=vector_size)
        
        qdrant_points = [
            qmodels.PointStruct(
                id=p["id"],
                vector=p["vector"],
                payload=p["payload"]
            )
            for p in points
        ]
        
        self.client.upsert(
            collection_name=self.collection_name,
            points=qdrant_points
        )

    async def search(
        self,
        query_vector: List[float],
        org_id: str,
        collection_id: Optional[str] = None,
        top_k: int = 5,
        similarity_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        self.ensure_collection(vector_size=len(query_vector))

        filter_conditions = [
            qmodels.FieldCondition(
                key="org_id",
                match=qmodels.MatchValue(value=org_id)
            )
        ]

        if collection_id:
            filter_conditions.append(
                qmodels.FieldCondition(
                    key="collection_id",
                    match=qmodels.MatchValue(value=collection_id)
                )
            )

        query_filter = qmodels.Filter(must=filter_conditions)

        try:
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_vector,
                query_filter=query_filter,
                limit=top_k,
                score_threshold=similarity_threshold
            )

            output: List[Dict[str, Any]] = []
            for hit in results:
                payload = hit.payload or {}
                output.append({
                    "id": str(hit.id),
                    "score": float(hit.score),
                    "text": payload.get("text", ""),
                    "filename": payload.get("filename", ""),
                    "document_id": payload.get("document_id", ""),
                    "collection_id": payload.get("collection_id", ""),
                    "page_number": payload.get("page_number", 1),
                    "chunk_index": payload.get("chunk_index", 0)
                })

            return output
        except Exception:
            return []

    async def delete_document_chunks(self, document_id: str, org_id: str):
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=qmodels.FilterSelector(
                    filter=qmodels.Filter(
                        must=[
                            qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id)),
                            qmodels.FieldCondition(key="org_id", match=qmodels.MatchValue(value=org_id))
                        ]
                    )
                )
            )
        except Exception:
            pass

vector_store = QdrantVectorStore()
