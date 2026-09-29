from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.database import get_connection
from app.services.ingestion import ingest_document


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("")
def list_documents():
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                id,
                filename,
                file_type,
                status,
                uploaded_at
            FROM documents
            ORDER BY uploaded_at DESC;
            """
        )

        rows = cursor.fetchall()

        return [
            {
                "id": row[0],
                "filename": row[1],
                "file_type": row[2],
                "status": row[3],
                "uploaded_at": row[4],
            }
            for row in rows
        ]

    finally:
        cursor.close()
        connection.close()


@router.delete("/{document_id}")
def delete_document(document_id: int):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            DELETE FROM documents
            WHERE id = %s
            RETURNING id;
            """,
            (document_id,)
        )

        deleted = cursor.fetchone()

        if deleted is None:
            raise HTTPException(
                status_code=404,
                detail="Document not found."
            )

        connection.commit()

        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }

    finally:
        cursor.close()
        connection.close()


@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required."
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    original_filename = Path(file.filename).name

    try:
        file_bytes = file.file.read()

        result = ingest_document(
            file_bytes=file_bytes,
            original_filename=original_filename,
            content_type=file.content_type
        )

        return {
            "message": "Document uploaded and processed successfully",
            **result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )