import numpy as np
from typing import List, Dict, Tuple
from app.rag.documents import Document

class InMemoryVectorStore:
    def __init__(self) -> None:
        self.documents: Dict[str, Document] = {}
        self.embeddings: Dict[str, np.ndarray] = {}

    def add_documents(self, docs: List[Document], embeddings: List[List[float]]) -> None:
        for doc, emb in zip(docs, embeddings):
            self.documents[doc.document_id] = doc
            self.embeddings[doc.document_id] = np.array(emb)

    def similarity_search(self, query_vector: List[float], k: int = 3) -> List[Tuple[Document, float]]:
        if not self.embeddings:
            return []
        
        q_vec = np.array(query_vector)
        results = []
        for doc_id, emb in self.embeddings.items():
            dot_product = np.dot(q_vec, emb)
            norm_q = np.linalg.norm(q_vec)
            norm_e = np.linalg.norm(emb)
            similarity = float(dot_product / (norm_q * norm_e)) if norm_q > 0 and norm_e > 0 else 0.0
            results.append((self.documents[doc_id], similarity))
        
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:k]
