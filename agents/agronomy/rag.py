import os
import re
import numpy as np
from typing import Dict, Any, List
from agents.agronomy.config import KNOWLEDGE_DIR

class OrganicKnowledgeRAG:
    def __init__(self) -> None:
        self.chunks = []
        self.vocab = []
        self.idf = {}
        self.chunk_vectors = []
        self.filepath = os.path.join(KNOWLEDGE_DIR, "organic_farming.txt")
        self.initialize_rag()
        
    def initialize_rag(self) -> None:
        """
        Loads the knowledge document, parses metadata blocks, tokenizes text,
        computes IDFs, and builds TF-IDF representation for similarity queries.
        """
        if not os.path.exists(self.filepath):
            return
            
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Split contents by double newline separator
            blocks = content.strip().split("\n\n")
            for block in blocks:
                if not block.strip():
                    continue
                    
                meta = {
                    "source": "Unknown Source",
                    "title": "Organic Agriculture Handbook",
                    "chapter": "N/A",
                    "page": "N/A",
                    "topic": "General",
                    "text": ""
                }
                
                lines = block.split("\n")
                body_lines = []
                for line in lines:
                    if line.startswith("[Source:"):
                        meta["source"] = line.split(":", 1)[1].strip(" ]")
                    elif line.startswith("[Title:"):
                        meta["title"] = line.split(":", 1)[1].strip(" ]")
                    elif line.startswith("[Chapter:"):
                        meta["chapter"] = line.split(":", 1)[1].strip(" ]")
                    elif line.startswith("[Page:"):
                        meta["page"] = line.split(":", 1)[1].strip(" ]")
                    elif line.startswith("[Topic:"):
                        meta["topic"] = line.split(":", 1)[1].strip(" ]")
                    else:
                        body_lines.append(line)
                        
                meta["text"] = "\n".join(body_lines).strip()
                if meta["text"]:
                    self.chunks.append(meta)
                    
            if not self.chunks:
                return
                
            # Build TF-IDF indexing
            # Tokenize all chunks
            tokenized_chunks = [self._tokenize(c["text"] + " " + c["topic"]) for c in self.chunks]
            
            # Vocab creation
            all_words = set()
            for tokens in tokenized_chunks:
                all_words.update(tokens)
            self.vocab = list(all_words)
            
            # Compute IDF
            num_docs = len(self.chunks)
            for word in self.vocab:
                doc_count = sum(1 for tokens in tokenized_chunks if word in tokens)
                # Apply standard smoothed IDF formula
                self.idf[word] = np.log((1 + num_docs) / (1 + doc_count)) + 1
                
            # Compute TF-IDF vectors for all chunks
            self.chunk_vectors = []
            for tokens in tokenized_chunks:
                self.chunk_vectors.append(self._vectorize(tokens))
                
        except Exception as e:
            # Safely log and remain operational
            print(f"Failed to initialize RAG index: {e}")

    def _tokenize(self, text: str) -> List[str]:
        """
        Standard normalizer and tokenizer.
        """
        words = re.findall(r'\w+', text.lower())
        # Filter out extremely short words
        return [w for w in words if len(w) > 2]

    def _vectorize(self, tokens: List[str]) -> np.ndarray:
        """
        Creates a TF-IDF vector from token array.
        """
        vec = np.zeros(len(self.vocab))
        if not tokens:
            return vec
            
        # Term Frequency (TF)
        tf_dict = {}
        for token in tokens:
            tf_dict[token] = tf_dict.get(token, 0) + 1
            
        for token, tf in tf_dict.items():
            if token in self.idf:
                vocab_idx = self.vocab.index(token)
                vec[vocab_idx] = tf * self.idf[token]
                
        # L2 Normalization
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Searches the knowledge base using Cosine Similarity on TF-IDF vectors.
        """
        if not self.chunks or len(self.chunk_vectors) == 0:
            return []
            
        query_tokens = self._tokenize(query)
        query_vec = self._vectorize(query_tokens)
        query_norm = np.linalg.norm(query_vec)
        
        if query_norm == 0:
            # Fallback to top-k elements if empty query
            results = []
            for i in range(min(top_k, len(self.chunks))):
                item = self.chunks[i].copy()
                item["relevance_score"] = 0.0
                results.append(item)
            return results
            
        results = []
        for idx, chunk_vec in enumerate(self.chunk_vectors):
            # Cosine similarity (since vectors are L2 normalized, dot product is cosine similarity)
            score = float(np.dot(query_vec, chunk_vec))
            item = self.chunks[idx].copy()
            item["relevance_score"] = round(score, 4)
            results.append(item)
            
        # Sort and return top-k matches
        results = sorted(results, key=lambda x: x["relevance_score"], reverse=True)
        return results[:top_k]
