import { LayersIcon, SendIcon } from "./Icons";

export default function Composer({
  question,
  onQuestionChange,
  onAsk,
  loading,
  documents,
  selectedDocument,
  onSelectDocument,
}) {
  const canAsk = !loading && question.trim();

  return (
    <div className="composer">
      <textarea
        placeholder="Ask something about your documents…"
        value={question}
        rows={3}
        onChange={(event) => onQuestionChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && canAsk) {
            event.preventDefault();
            onAsk();
          }
        }}
      />

      <div className="composer-bar">
        <label className="scope" htmlFor="document">
          <LayersIcon width={15} height={15} />
          <span className="visually-hidden">Search within document</span>
          <select
            id="document"
            value={selectedDocument}
            onChange={(event) => onSelectDocument(event.target.value)}
          >
            <option value="">All documents</option>
            {documents
              .filter((document) => document.status === "completed")
              .map((document) => (
                <option key={document.id} value={document.id}>
                  {document.filename}
                </option>
              ))}
          </select>
        </label>

        <span className="hint">
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
        </span>

        <button className="btn btn-primary btn-send" onClick={onAsk} disabled={!canAsk}>
          {loading ? (
            <>
              <span className="spinner" /> Thinking
            </>
          ) : (
            <>
              Ask <SendIcon width={16} height={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
