import uuid
from pathlib import Path

from psycopg.types.json import Jsonb
from sentence_transformers import SentenceTransformer

from app.database import get_connection
from page_chunker import create_chunks


model = SentenceTransformer("all-MiniLM-L6-v2")

DOCUMENTS_DIR = Path("documents")
DOCUMENTS_DIR.mkdir(exist_ok=True)


def ingest_document(
    file_bytes: bytes,
    original_filename: str,
    content_type: str,
):
    stored_filename = f"{uuid.uuid4()}_{original_filename}"
    file_path = DOCUMENTS_DIR / stored_filename

    connection = None
    cursor = None
    document_id = None

    try:
        # 1. Save PDF
        with open(file_path, "wb") as buffer:
            buffer.write(file_bytes)

        # 2. Create document record
        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO documents
            (filename, file_type, status)
            VALUES (%s, %s, %s)
            RETURNING id;
            """,
            (
                original_filename,
                content_type,
                "processing",
            ),
        )

        document_id = cursor.fetchone()[0]
        connection.commit()

        # 3. Extract and chunk
        chunks = create_chunks(
            str(file_path),
            original_filename,
        )

        if not chunks:
            raise ValueError(
                "No text could be extracted from the PDF."
            )

        # 4. Generate embeddings
        texts = [chunk["content"] for chunk in chunks]
        embeddings = model.encode(texts)

        # 5. Store chunks
        for chunk, embedding in zip(chunks, embeddings):

            cursor.execute(
                """
                INSERT INTO document_chunks
                (
                    document_id,
                    content,
                    metadata,
                    embedding
                )
                VALUES (%s, %s, %s, %s::vector);
                """,
                (
                    document_id,
                    chunk["content"],
                    Jsonb(chunk["metadata"]),
                    embedding.tolist().__str__(),
                ),
            )

        # 6. Mark completed
        cursor.execute(
            """
            UPDATE documents
            SET status = 'completed'
            WHERE id = %s;
            """,
            (document_id,),
        )

        connection.commit()

        return {
            "document_id": document_id,
            "filename": original_filename,
            "chunks_created": len(chunks),
        }

    except Exception:

        if connection and document_id:

            try:
                cursor.execute(
                    """
                    UPDATE documents
                    SET status = 'failed'
                    WHERE id = %s;
                    """,
                    (document_id,),
                )

                connection.commit()

            except Exception:
                pass

        raise

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()

        if file_path.exists():
            file_path.unlink()