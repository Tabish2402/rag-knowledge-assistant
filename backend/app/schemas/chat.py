from typing import Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(
        default=0.22,
        ge=0.0,
        le=1.0
    )
    document_id: Optional[int] = Field(
        default=None,
        ge=1
    )