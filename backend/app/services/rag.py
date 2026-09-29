from app.services.retrieval import hybrid_search
from app.services.llm import generate_answer


def build_rag_prompt(query: str, reranked_results):
    context_parts = []

    for citation_number, item in enumerate(
        reranked_results,
        start=1
    ):
        (
            chunk_id,
            chunk_document_id,
            content,
            metadata,
            similarity,
        ) = item["result"]

        context_parts.append(
            f"""
SOURCE [{citation_number}]

Document: {metadata['source']}
Page: {metadata['page']}
Chunk: {metadata['chunk_index']}

CONTENT:
{content}
"""
        )

    context = "\n\n".join(context_parts)

    return f"""
You are a document question-answering assistant.

Answer the user's question using ONLY the information
contained in the provided context.

Rules:
1. Do not use outside knowledge.
2. Do not invent information.
3. If the answer is not supported by the context, say exactly:
   "I don't have enough information to answer that."
4. Keep the answer concise and factual.
5. Whenever you make a factual claim from the context,
   cite the relevant source using its citation number.
6. Use citations exactly in this format: [1], [2], [3].
7. Only use citation numbers that actually exist in the provided context.
8. Do not create or invent citation numbers.
9. Do not write document names or page numbers as citations yourself.

CONTEXT:
{context}

USER QUESTION:
{query}
"""


def build_sources(reranked_results):
    sources = []

    for citation_number, item in enumerate(
        reranked_results,
        start=1
    ):
        (
            chunk_id,
            chunk_document_id,
            content,
            metadata,
            similarity,
        ) = item["result"]

        sources.append(
            {
                "citation": citation_number,
                "document_id": chunk_document_id,
                "document": metadata["source"],
                "page": metadata["page"],
                "chunk": metadata["chunk_index"],
                "vector_similarity": round(
                    float(similarity),
                    4
                ),
                "rrf_score": round(
                    float(item["rrf_score"]),
                    6
                ),
                "rerank_score": round(
                    float(item["rerank_score"]),
                    4
                ),
            }
        )

    return sources


def answer_question(
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.22,
    document_id: int | None = None
):
    reranked_results = hybrid_search(
        query=query,
        top_k=top_k,
        similarity_threshold=similarity_threshold,
        document_id=document_id,
    )

    prompt = build_rag_prompt(
        query,
        reranked_results,
    )

    answer = generate_answer(prompt)

    sources = build_sources(reranked_results)

    return {
        "answer": answer,
        "sources": sources,
    }