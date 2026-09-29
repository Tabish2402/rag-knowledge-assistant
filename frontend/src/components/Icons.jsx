const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--accent-1)" />
        <stop offset="1" stopColor="var(--accent-2)" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#logo-grad)" />
    <path
      d="M11 21V11h5.2a3.3 3.3 0 0 1 0 6.6H11m5.6 0L21 21"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const UploadIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const FileIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);

export const SendIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" />
  </svg>
);

export const SparkIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.5 2.5m6.4 6.4 2.5 2.5m0-11.4-2.5 2.5m-6.4 6.4-2.5 2.5" />
  </svg>
);

export const LayersIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m12 3 9 5-9 5-9-5z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export const CopyIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="8" y="8" width="12" height="12" rx="2.5" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </svg>
);

export const CheckIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const AlertIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5m0 3.5v.01" />
  </svg>
);
