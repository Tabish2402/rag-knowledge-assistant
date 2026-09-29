import { useState } from "react";
import { AlertIcon, CheckIcon, FileIcon, UploadIcon } from "./Icons";

function statusTone(status) {
  if (!status) return null;
  if (status.startsWith("Error")) return "error";
  if (status === "Uploading...") return "pending";
  return "success";
}

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ file, onFileChange, onUpload, status }) {
  const [dragging, setDragging] = useState(false);
  const tone = statusTone(status);
  const uploading = tone === "pending";

  return (
    <section className="panel upload">
      <div className="panel-head">
        <span className="eyebrow">Ingest</span>
        <h2>Add a document</h2>
      </div>

      <label
        className={`dropzone${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) onFileChange(dropped);
        }}
      >
        <input
          type="file"
          accept=".pdf"
          className="visually-hidden"
          onChange={(event) => onFileChange(event.target.files[0])}
        />

        {file ? (
          <div className="dropzone-file">
            <span className="file-glyph">
              <FileIcon />
            </span>
            <span className="dropzone-file-text">
              <strong title={file.name}>{file.name}</strong>
              <small>{formatSize(file.size)} · click to change</small>
            </span>
          </div>
        ) : (
          <>
            <span className="dropzone-icon">
              <UploadIcon width={22} height={22} />
            </span>
            <strong>Drop a PDF here</strong>
            <small>or click to browse</small>
          </>
        )}
      </label>

      <button
        className="btn btn-primary btn-block"
        onClick={onUpload}
        disabled={!file || uploading}
      >
        {uploading ? (
          <>
            <span className="spinner" /> Processing…
          </>
        ) : (
          <>
            <UploadIcon width={16} height={16} /> Upload &amp; index
          </>
        )}
      </button>

      {status && (
        <p className={`toast toast-${tone}`} role="status">
          {tone === "error" && <AlertIcon width={16} height={16} />}
          {tone === "success" && <CheckIcon width={16} height={16} />}
          {tone === "pending" && <span className="spinner" />}
          <span>{status}</span>
        </p>
      )}
    </section>
  );
}
