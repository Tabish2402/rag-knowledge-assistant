from page_extractor import extract_pages
from chunker import chunk_text


def create_chunks(pdf_path, source_name):
    pages = extract_pages(pdf_path)

    all_chunks = []
    chunk_index = 0

    for page in pages:
        chunks = chunk_text(
            page["text"],
            chunk_size=500,
            overlap=100
        )

        for chunk in chunks:
            chunk_index += 1

            all_chunks.append({
                "content": chunk,
                "metadata": {
                    "source": source_name,
                    "page": page["page"],
                    "chunk_index": chunk_index
                }
            })

    return all_chunks