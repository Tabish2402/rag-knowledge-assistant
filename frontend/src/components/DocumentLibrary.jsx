import { FileIcon, LayersIcon } from "./Icons";

const STATUS_LABELS = {
  completed: "Ready",
  processing: "Indexing",
  failed: "Failed",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DocumentLibrary({ documents, selectedDocument, onSelect }) {
  const ready = documents.filter((document) => document.status === "completed").length;

  return (
    <section className="panel library">
      <div className="panel-head">
        <span className="eyebrow">Library</span>
        <h2>
          Documents <span className="count">{documents.length}</span>
        </h2>
      </div>

      <div className="library-list">
        <button
          className={`doc-item${selectedDocument === "" ? " is-active" : ""}`}
          onClick={() => onSelect("")}
        >
          <span className="doc-glyph doc-glyph-all">
            <LayersIcon width={16} height={16} />
          </span>
          <span className="doc-text">
            <strong>All documents</strong>
            <small>{ready} ready to search</small>
          </span>
        </button>

        {documents.length === 0 && (
          <p className="library-empty">No documents yet. Upload a PDF to get started.</p>
        )}

        {documents.map((document) => {
          const isReady = document.status === "completed";
          const isActive = selectedDocument === String(document.id);

          return (
            <button
              key={document.id}
              className={`doc-item${isActive ? " is-active" : ""}`}
              onClick={() => onSelect(String(document.id))}
              disabled={!isReady}
              title={document.filename}
            >
              <span className="doc-glyph">
                <FileIcon width={16} height={16} />
              </span>
              <span className="doc-text">
                <strong>{document.filename}</strong>
                <small>{formatDate(document.uploaded_at)}</small>
              </span>
              <span className={`badge badge-${document.status}`}>
                {STATUS_LABELS[document.status] ?? document.status}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
