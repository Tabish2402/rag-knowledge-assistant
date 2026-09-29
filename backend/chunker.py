import re


def clean_text(text):
    """
    Normalize whitespace extracted from PDFs.
    """

    text = text.replace("\xa0", " ")

    # Collapse multiple spaces
    text = re.sub(r"[ \t]+", " ", text)

    # Collapse excessive newlines
    text = re.sub(r"\n+", "\n", text)

    return text.strip()


def chunk_text(text, chunk_size=500, overlap=100):
    """
    Split text into word-boundary chunks.

    chunk_size and overlap are measured approximately
    in characters, but we never cut a word in half.
    """

    text = clean_text(text)

    words = text.split()

    chunks = []

    current_words = []
    current_length = 0

    for word in words:

        word_length = len(word) + 1

        if current_words and current_length + word_length > chunk_size:

            chunk = " ".join(current_words)
            chunks.append(chunk)

            # Build overlap using complete words
            overlap_words = []
            overlap_length = 0

            for previous_word in reversed(current_words):

                word_length = len(previous_word) + 1

                if overlap_length + word_length > overlap:
                    break

                overlap_words.insert(0, previous_word)
                overlap_length += word_length

            current_words = overlap_words
            current_length = overlap_length

        current_words.append(word)
        current_length += word_length

    if current_words:
        chunks.append(" ".join(current_words))

    return chunks