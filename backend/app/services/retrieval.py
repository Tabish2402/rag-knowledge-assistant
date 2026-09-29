from sentence_transformers import SentenceTransformer, CrossEncoder
from app.database import get_connection


# Embedding model for initial retrieval
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Cross-encoder for reranking
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")


def vector_search(
    query: str,
    candidate_k: int = 10,
    similarity_threshold: float = 0.22,
    document_id: int | None = None
):
    query_embedding = embedding_model.encode(query)

    connection = get_connection()
    cursor = connection.cursor()

    sql = """
        SELECT
            id,
            document_id,
            content,
            metadata,
            1 - (embedding <=> %s::vector) AS similarity
        FROM document_chunks
        WHERE 1 - (embedding <=> %s::vector) >= %s
    """

    params = [
        query_embedding.tolist().__str__(),
        query_embedding.tolist().__str__(),
        similarity_threshold,
    ]

    if document_id is not None:
        sql += " AND document_id = %s"
        params.append(document_id)

    sql += """
        ORDER BY embedding <=> %s::vector
        LIMIT %s;
    """

    params.extend([
        query_embedding.tolist().__str__(),
        candidate_k,
    ])

    cursor.execute(sql, params)

    results = cursor.fetchall()

    cursor.close()
    connection.close()

    return results


def keyword_search(
    query: str,
    candidate_k: int = 10,
    document_id: int | None = None
):
    connection = get_connection()
    cursor = connection.cursor()

    sql = """
        SELECT
            id,
            document_id,
            content,
            metadata,
            ts_rank_cd(
                to_tsvector('english', content),
                plainto_tsquery('english', %s)
            ) AS keyword_score
        FROM document_chunks
        WHERE to_tsvector('english', content)
              @@ plainto_tsquery('english', %s)
    """

    params = [query, query]

    if document_id is not None:
        sql += " AND document_id = %s"
        params.append(document_id)

    sql += """
        ORDER BY keyword_score DESC
        LIMIT %s;
    """

    params.append(candidate_k)

    cursor.execute(sql, params)

    results = cursor.fetchall()

    cursor.close()
    connection.close()

    return results


def reciprocal_rank_fusion(
    vector_results,
    keyword_results,
    top_k=15,
    k=60
):
    fused = {}

    for rank, result in enumerate(vector_results, start=1):
        chunk_id = result[0]

        if chunk_id not in fused:
            fused[chunk_id] = {
                "result": result,
                "rrf_score": 0.0
            }

        fused[chunk_id]["rrf_score"] += 1 / (k + rank)

    for rank, result in enumerate(keyword_results, start=1):
        chunk_id = result[0]

        if chunk_id not in fused:
            fused[chunk_id] = {
                "result": result,
                "rrf_score": 0.0
            }

        fused[chunk_id]["rrf_score"] += 1 / (k + rank)

    ranked = sorted(
        fused.values(),
        key=lambda item: item["rrf_score"],
        reverse=True
    )

    return [
        (item["result"], item["rrf_score"])
        for item in ranked[:top_k]
    ]


def rerank_results(query: str, candidates, top_k: int = 5):
    """
    Rerank retrieved chunks using a cross-encoder.
    """

    if not candidates:
        return []

    pairs = []

    for result, rrf_score in candidates:
        content = result[2]
        pairs.append((query, content))

    rerank_scores = reranker.predict(pairs)

    reranked = []

    for candidate, score in zip(candidates, rerank_scores):
        result, rrf_score = candidate

        reranked.append(
            {
                "result": result,
                "rrf_score": float(rrf_score),
                "rerank_score": float(score),
            }
        )

    reranked.sort(
        key=lambda item: item["rerank_score"],
        reverse=True
    )

    return reranked[:top_k]


def hybrid_search(
    query: str,
    top_k: int = 5,
    similarity_threshold: float = 0.22,
    document_id: int | None = None
):
    vector_results = vector_search(
        query=query,
        candidate_k=10,
        similarity_threshold=similarity_threshold,
        document_id=document_id
    )

    keyword_results = keyword_search(
        query=query,
        candidate_k=10,
        document_id=document_id
    )

    fused_results = reciprocal_rank_fusion(
        vector_results=vector_results,
        keyword_results=keyword_results,
        top_k=15
    )

    return rerank_results(
        query=query,
        candidates=fused_results,
        top_k=top_k
    )