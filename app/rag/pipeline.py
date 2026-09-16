from app.rag.retriever import RAGRetriever

class RAGPipeline:
    def __init__(self, retriever: RAGRetriever) -> None:
        self.retriever = retriever

    async def get_context(self, query: str, k: int = 3) -> str:
        results = await self.retriever.retrieve(query, k=k)
        if not results:
            return "No verified source material found for the query."
        
        context_parts = []
        for doc, score in results:
            context_parts.append(
                f"[Source: {doc.source} ({doc.source_type}), Year: {doc.year}, Verified: {doc.verified}]\n"
                f"Title: {doc.title}\n"
                f"Content: {doc.content}"
            )
        return "\n---\n".join(context_parts)
