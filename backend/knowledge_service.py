import logging
import re
from pathlib import Path
from typing import Any, Dict, List
from firebase_service import FirebaseService

logger = logging.getLogger("sih_helpdesk.knowledge")

def _find_knowledge_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent / "knowledge",
        Path(__file__).resolve().parent / "knowledge",
        Path.cwd() / "knowledge",
        Path.cwd() / "backend" / "knowledge",
    ]
    for p in candidates:
        if p.exists() and p.is_dir():
            return p
    return candidates[0]

KNOWLEDGE_DIR = _find_knowledge_dir()


class KnowledgeService:
    @staticmethod
    def load_markdown_files() -> List[Dict[str, str]]:
        documents = []
        target_dir = _find_knowledge_dir()
        if not target_dir.exists():
            logger.warning(f"Knowledge directory not found at {target_dir}")
            return documents

        for md_file in target_dir.glob("*.md"):
            try:
                content = md_file.read_text(encoding="utf-8")
                documents.append({
                    "id": md_file.stem,
                    "title": md_file.stem.replace("_", " ").title(),
                    "source": md_file.name,
                    "content": content
                })
            except Exception as e:
                logger.error(f"Error reading knowledge file {md_file}: {e}")
        return documents

    @staticmethod
    def chunk_document(doc_title: str, content: str) -> List[Dict[str, str]]:
        chunks = []
        # Split by markdown headers (# or ## or ###)
        sections = re.split(r'\n(?=#{1,3}\s)', content)
        for section in sections:
            clean_sec = section.strip()
            if not clean_sec:
                continue
            lines = clean_sec.splitlines()
            header = lines[0].replace("#", "").strip() if lines else doc_title
            chunks.append({
                "title": f"{doc_title} - {header}",
                "content": clean_sec
            })
        return chunks

    @classmethod
    async def get_all_chunks(cls) -> List[Dict[str, str]]:
        all_chunks = []

        # 1. Local markdown files
        md_docs = cls.load_markdown_files()
        for doc in md_docs:
            chunks = cls.chunk_document(doc["title"], doc["content"])
            all_chunks.extend(chunks)

        # 2. Dynamic DB knowledge items
        try:
            db_items = await FirebaseService.get_all_knowledge()
            for item in db_items:
                all_chunks.append({
                    "title": f"Dynamic KB: {item.get('title', 'General')}",
                    "content": f"{item.get('title', '')}\nCategory: {item.get('category', 'General')}\n{item.get('content', '')}"
                })
        except Exception as e:
            logger.error(f"Failed to fetch dynamic DB knowledge items: {e}")

        return all_chunks

    @classmethod
    async def search_relevant_knowledge(cls, query: str, top_k: int = 3) -> str:
        chunks = await cls.get_all_chunks()
        if not chunks:
            return "No official SIH knowledge base documents are available."

        query_tokens = set(re.findall(r'\w+', query.lower()))
        # Remove common stopwords
        stopwords = {"i", "want", "to", "how", "can", "what", "is", "the", "a", "an", "for", "in", "of", "on", "and", "do", "we", "my", "our", "are"}
        meaningful_tokens = query_tokens - stopwords
        if not meaningful_tokens:
            meaningful_tokens = query_tokens

        scored_chunks = []
        for chunk in chunks:
            score = 0
            text_lower = (chunk["title"] + " " + chunk["content"]).lower()
            for token in meaningful_tokens:
                if token in text_lower:
                    score += 2 if token in chunk["title"].lower() else 1
            if score > 0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = scored_chunks[:top_k]

        if not top_chunks:
            # Fallback to top 2 general chunks
            return "\n\n---\n\n".join([f"### {c['title']}\n{c['content']}" for c in chunks[:2]])

        formatted_knowledge = "\n\n---\n\n".join([
            f"### {chunk['title']}\n{chunk['content']}" for _, chunk in top_chunks
        ])
        return formatted_knowledge
