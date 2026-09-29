import { useState } from "react";
import { AlertIcon, CheckIcon, CopyIcon, SparkIcon } from "./Icons";

// Renders **bold** and [n] citations inside a line of streamed text.
function renderInline(text, keyPrefix) {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (/^\[\d+\]$/.test(part)) return <sup key={key} className="cite">{part.slice(1, -1)}</sup>;
    return part;
  });
}

// Groups lines into paragraphs and bullet lists for display.
function FormattedAnswer({ text }) {
  const blocks = [];
  let list = null;

  text.split("\n").forEach((line, index) => {
    const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (bullet) {
      if (!list) {
        list = [];
        blocks.push({ type: "list", items: list, key: index });
      }
      list.push(bullet[1]);
      return;
    }
    list = null;
    if (line.trim()) {
      const heading = line.match(/^#{1,6}\s+(.*)$/);
      blocks.push({ type: heading ? "heading" : "p", text: heading ? heading[1] : line, key: index });
    }
  });

  return blocks.map((block) => {
    if (block.type === "list") {
      return (
        <ul key={block.key}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item, `${block.key}-${i}`)}</li>
          ))}
        </ul>
      );
    }
    if (block.type === "heading") return <h4 key={block.key}>{renderInline(block.text, block.key)}</h4>;
    return <p key={block.key}>{renderInline(block.text, block.key)}</p>;
  });
}

export default function AnswerPanel({ answer, sources, loading }) {
  const [copied, setCopied] = useState(false);
  const isError = answer.startsWith("Error:");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; nothing to do.
    }
  };

  return (
    <section className={`answer-card${isError ? " is-error" : ""}`} aria-live="polite">
      <header className="answer-head">
        <span className="answer-badge">
          {isError ? <AlertIcon width={15} height={15} /> : <SparkIcon width={15} height={15} />}
        </span>
        <h2>{isError ? "Something went wrong" : "Answer"}</h2>

        <span className={`live-pill${loading ? " is-live" : ""}`}>
          <span className="dot" />
          {loading ? "Streaming" : isError ? "Failed" : "Grounded"}
        </span>

        {answer && !loading && !isError && (
          <button className="icon-btn" onClick={copy} aria-label="Copy answer">
            {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
          </button>
        )}
      </header>

      {answer ? (
        <div className={`answer-body${loading ? " is-streaming" : ""}`}>
          {isError ? <p>{answer.replace(/^Error:\s*/, "")}</p> : <FormattedAnswer text={answer} />}
        </div>
      ) : (
        <div className="skeleton" aria-label="Retrieving context">
          <div className="pipeline">
            <span>Embedding</span>
            <span>Hybrid search</span>
            <span>Reranking</span>
            <span>Generating</span>
          </div>
          <span className="skeleton-line" style={{ width: "92%" }} />
          <span className="skeleton-line" style={{ width: "78%" }} />
          <span className="skeleton-line" style={{ width: "54%" }} />
        </div>
      )}

      {sources.length > 0 && (
        <div className="sources">
          <h3>Sources</h3>
          <div className="source-grid">
            {sources.map((source, index) => (
              <article key={index} className="source">
                <span className="cite cite-lg">{source.citation}</span>
                <div className="source-main">
                  <strong title={source.document}>{source.document}</strong>
                  <small>Page {source.page}</small>
                </div>
                <div className="source-scores">
                  <span>Vector {source.vector_similarity}</span>
                  <span>RRF {source.rrf_score}</span>
                  <span>Rerank {source.rerank_score}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
