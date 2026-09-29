const SUGGESTIONS = [
  "Summarize the key points of this document",
  "What skills and technologies are mentioned?",
  "List all dates and deadlines",
];

export default function EmptyState({ onPick }) {
  return (
    <div className="empty">
      <div className="orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p>Answers appear here, grounded in your documents and cited by source.</p>
      <div className="chips">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} className="chip" onClick={() => onPick(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
