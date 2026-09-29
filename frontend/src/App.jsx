import { useEffect, useState } from "react";
import "./App.css";
import { LogoMark } from "./components/Icons";
import UploadZone from "./components/UploadZone";
import DocumentLibrary from "./components/DocumentLibrary";
import Composer from "./components/Composer";
import AnswerPanel from "./components/AnswerPanel";
import EmptyState from "./components/EmptyState";

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  const loadDocuments = async () => {
    const response = await fetch(`${API_URL}/documents`);

    if (!response.ok) {
      throw new Error("Failed to load documents");
    }

    return response.json();
  };

  const fetchDocuments = async () => {
    try {
      setDocuments(await loadDocuments());
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  // Load documents when the application starts
  useEffect(() => {
    loadDocuments()
      .then(setDocuments)
      .catch((error) => {
        console.error("Error loading documents:", error);
      });
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

    // Sources arrive as URL-encoded JSON in a response header
    const sourcesHeader = response.headers.get("X-RAG-Sources");

    if (sourcesHeader) {
      try {
        setSources(JSON.parse(decodeURIComponent(sourcesHeader)));
      } catch (error) {
        console.error("Error parsing sources:", error);
      }
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
      <div className="backdrop" aria-hidden="true" />

      <aside className="sidebar">
        <div className="brand">
          <LogoMark />
          <div>
            <strong>Knowledge Assistant</strong>
            <small>Hybrid RAG · pgvector</small>
          </div>
        </div>

        <UploadZone
          file={file}
          onFileChange={setFile}
          onUpload={uploadDocument}
          status={uploadStatus}
        />

        <DocumentLibrary
          documents={documents}
          selectedDocument={selectedDocument}
          onSelect={setSelectedDocument}
        />
      </aside>

      <main className="workspace">
        <header className="hero">
          <span className="eyebrow eyebrow-pill">
            <span className="dot" /> Retrieval-augmented · cited answers
          </span>
          <h1>
            Ask your documents <em>anything.</em>
          </h1>
          <p>
            Semantic and keyword search, fused and reranked, so every answer
            comes straight from your PDFs.
          </p>
        </header>

        <Composer
          question={question}
          onQuestionChange={setQuestion}
          onAsk={askQuestion}
          loading={loading}
          documents={documents}
          selectedDocument={selectedDocument}
          onSelectDocument={setSelectedDocument}
        />

        {answer || loading ? (
          <AnswerPanel answer={answer} sources={sources} loading={loading} />
        ) : (
          <EmptyState onPick={setQuestion} />
        )}
      </main>
    </div>
  );
}

export default App;
