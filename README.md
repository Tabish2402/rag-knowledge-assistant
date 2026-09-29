# RAG Knowledge Assistant

A Retrieval-Augmented Generation (RAG) assistant that lets you upload PDF documents and ask grounded questions about their contents, with source citations.

It combines semantic vector search, PostgreSQL keyword search, Reciprocal Rank Fusion (RRF) and cross-encoder reranking to pick the most relevant chunks before an LLM generates the answer.

## Features

- PDF upload with page-aware extraction and overlapping chunking
- Hybrid retrieval: pgvector semantic search + PostgreSQL full-text search, fused with RRF
- Cross-encoder reranking
- Grounded answers with page-level source citations
- Streaming responses
- Filtering by document and similarity threshold
- Docker Compose setup

## How It Works

```text
Ingestion:  PDF → Text Extraction → Page-aware Chunking → Embeddings → PostgreSQL + pgvector

Query:      Question → Embedding → Vector Search + Keyword Search → RRF
                     → Cross-Encoder Reranking → Top-K Chunks → Grounded Prompt → LLM
                     → Answer + Citations
```

- **Embeddings:** `all-MiniLM-L6-v2` (384 dimensions)
- **Reranker:** `cross-encoder/ms-marco-MiniLM-L-6-v2`
- **LLM:** via OpenRouter (OpenAI-compatible API)

The prompt tells the model to answer only from the retrieved context, cite its sources, and say when the context isn't enough. This reduces hallucinations but can't rule them out.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Retrieval | Sentence Transformers, Cross-Encoder, OpenRouter |
| Database | PostgreSQL, pgvector |
| Infrastructure | Docker, Docker Compose, Nginx |

## Project Structure

```text
backend/
├── app/
│   ├── routes/      # chat and document endpoints
│   ├── schemas/     # Pydantic models
│   ├── services/    # ingestion, retrieval, RAG, LLM
│   ├── database.py
│   └── main.py
├── page_extractor.py
├── page_chunker.py
└── requirements.txt
frontend/
└── src/             # React app
docker-compose.yml
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js
- Docker Desktop
- An [OpenRouter](https://openrouter.ai) API key

### Configuration

Copy `.env.example` to `backend/.env` and fill in your values:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
DB_HOST=localhost
DB_PORT=5433
DB_NAME=rag_knowledge
DB_USER=rag_user
DB_PASSWORD=rag_password
```

Never commit the real `.env` file.

### Run with Docker

```bash
docker compose up --build
```

| Service | Address |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

### Run Locally

Start the database:

```bash
docker compose up -d db
```

Start the backend:

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/documents` | List uploaded documents and their status |
| `POST` | `/documents/upload` | Upload and ingest a PDF |
| `DELETE` | `/documents/{document_id}` | Delete a document and its chunks |
| `POST` | `/chat` | Ask a question |
| `POST` | `/chat/stream` | Ask a question with a streamed answer |

Example chat request:

```json
{
  "question": "What technologies are mentioned in the document?",
  "top_k": 5,
  "similarity_threshold": 0.22,
  "document_id": 1
}
```

`document_id` is optional. The response contains `answer` and `sources` (document, page, chunk and retrieval scores).

## Roadmap

- Retrieval evaluation (precision/recall)
- Query rewriting
- Authentication
- Conversation history
- CI/CD and cloud deployment
