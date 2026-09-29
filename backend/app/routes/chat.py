import json
from urllib.parse import quote

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.rag import (
    answer_question,
    build_rag_prompt,
    build_sources,
)
from app.services.retrieval import hybrid_search
from app.services.llm import generate_answer_stream


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


# Existing non-streaming endpoint
@router.post("")
def chat(request: ChatRequest):
    return answer_question(
        request.question,
        request.top_k,
        request.similarity_threshold,
        request.document_id,
    )


# New streaming endpoint
@router.post("/stream")
def chat_stream(request: ChatRequest):

    reranked_results = hybrid_search(
        query=request.question,
        top_k=request.top_k,
        similarity_threshold=request.similarity_threshold,
        document_id=request.document_id,
    )

    prompt = build_rag_prompt(
        request.question,
        reranked_results,
    )

    # Sources travel in a header so the streamed body stays plain answer text
    sources = build_sources(reranked_results)

    return StreamingResponse(
        generate_answer_stream(prompt),
        media_type="text/plain",
        headers={
            "X-RAG-Sources": quote(json.dumps(sources)),
        },
    )