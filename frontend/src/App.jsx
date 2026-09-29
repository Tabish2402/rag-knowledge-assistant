import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);

  const [loading, setLoading] = useState(false);

  // Document management
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");

  // Fetch all uploaded documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`);

      if (!response.ok) {
        throw new Error("Failed to load documents");
      }

      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  // Load documents when the application starts
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Upload a PDF
  const uploadDocument = async () => {
    if (!file) return;

    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${API_URL}/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setUploadStatus(
        `Uploaded successfully. ${data.chunks_created} chunks created.`
      );

      // Refresh document list after successful upload
      await fetchDocuments();

      // Clear selected file
      setFile(null);
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
    }
  };

const askQuestion = async () => {
  if (!question.trim()) return;

  setLoading(true);
  setAnswer("");
  setSources([]);

  try {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        top_k: 5,
        similarity_threshold: 0.22,
        document_id: selectedDocument
          ? Number(selectedDocument)
          : null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Request failed");
    }

    if (!response.body) {
      throw new Error("Streaming is not supported by this response.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let accumulatedAnswer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, {
        stream: true,
      });

      accumulatedAnswer += chunk;
      setAnswer(accumulatedAnswer);
    }
  } catch (error) {
    setAnswer(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="app">
      <header>
        <h1>RAG Knowledge Assistant</h1>

        <p>
          Upload documents and ask questions about their contents.
        </p>
      </header>

      <main>
        {/* Upload Section */}
        <section className="card">
          <h2>Upload Document</h2>

          <input
            type="file"
            accept=".pdf"
            onChange={(event) => {
              setFile(event.target.files[0]);
            }}
          />

          <button
            onClick={uploadDocument}
            disabled={!file}
          >
            Upload PDF
          </button>

          {uploadStatus && (
            <p className="status">
              {uploadStatus}
            </p>
          )}
        </section>

        {/* Question Section */}
        <section className="card">
          <h2>Ask a Question</h2>

          <textarea
            placeholder="Ask something about your documents..."
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
          />

          {/* Document Filter */}
          <div className="document-selector">
            <label htmlFor="document">
              Search within document
            </label>

            <select
              id="document"
              value={selectedDocument}
              onChange={(event) => {
                setSelectedDocument(event.target.value);
              }}
            >
              <option value="">
                All documents
              </option>

              {documents
                .filter(
                  (document) =>
                    document.status === "completed"
                )
                .map((document) => (
                  <option
                    key={document.id}
                    value={document.id}
                  >
                    {document.filename}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={askQuestion}
            disabled={loading || !question.trim()}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </section>

        {/* Answer Section */}
        {answer && (
          <section className="card">
            <h2>Answer</h2>

            <p className="answer">
              {answer}
            </p>

            {/* Sources */}
            {sources.length > 0 && (
              <>
                <h3>Sources</h3>

                <ul>
                  {sources.map((source, index) => (
                    <li key={index}>
                      <strong>
                        [{source.citation}]{" "}
                        {source.document}
                      </strong>

                      {" — Page "}
                      {source.page}

                      <div className="source-scores">
                        <span>
                          Vector:{" "}
                          {source.vector_similarity}
                        </span>

                        <span>
                          RRF:{" "}
                          {source.rrf_score}
                        </span>

                        <span>
                          Rerank:{" "}
                          {source.rerank_score}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;