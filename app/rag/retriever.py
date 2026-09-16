from typing import List, Tuple
from app.rag.documents import Document
from app.rag.embeddings import EmbeddingGenerator
from app.rag.vector_store import InMemoryVectorStore

class RAGRetriever:
    def __init__(self, vector_store: InMemoryVectorStore, embedding_generator: EmbeddingGenerator) -> None:
        self.vector_store = vector_store
        self.embedding_generator = embedding_generator

    async def retrieve(self, query: str, k: int = 3) -> List[Tuple[Document, float]]:
        embeddings = await self.embedding_generator.get_embeddings([query])
        if not embeddings:
            return []
        return self.vector_store.similarity_search(embeddings[0], k=k)
