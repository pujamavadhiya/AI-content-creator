from typing import List, Dict, Any
import re

def chunk_text(
    text: str,
    chunk_size: int = 1500,  # characters
    chunk_overlap: int = 200,
    page_number: int = 1
) -> List[Dict[str, Any]]:
    """
    Splits text into overlapping semantic chunks with metadata.
    Splits preferentially by paragraphs or sentences.
    """
    if not text or not text.strip():
        return []

    cleaned = re.sub(r"\r\n", "\n", text)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

    paragraphs = cleaned.split("\n\n")
    chunks: List[Dict[str, Any]] = []
    
    current_chunk = ""
    chunk_index = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) + 2 <= chunk_size:
            if current_chunk:
                current_chunk += "\n\n" + para
            else:
                current_chunk = para
        else:
            if current_chunk:
                chunks.append({
                    "chunk_index": chunk_index,
                    "text": current_chunk.strip(),
                    "page_number": page_number,
                    "token_count": len(current_chunk.split())
                })
                chunk_index += 1
                # Overlap: keep tail of current_chunk
                if chunk_overlap > 0 and len(current_chunk) > chunk_overlap:
                    current_chunk = current_chunk[-chunk_overlap:] + "\n\n" + para
                else:
                    current_chunk = para
            else:
                # Paragraph itself exceeds chunk_size; slice it
                for i in range(0, len(para), chunk_size - chunk_overlap):
                    sub = para[i:i + chunk_size]
                    chunks.append({
                        "chunk_index": chunk_index,
                        "text": sub.strip(),
                        "page_number": page_number,
                        "token_count": len(sub.split())
                    })
                    chunk_index += 1
                current_chunk = ""

    if current_chunk.strip():
        chunks.append({
            "chunk_index": chunk_index,
            "text": current_chunk.strip(),
            "page_number": page_number,
            "token_count": len(current_chunk.split())
        })

    return chunks
