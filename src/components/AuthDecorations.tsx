"use client";

export function AuthDecorations() {
  return (
    <>
      <div className="pointer-events-none fixed bottom-4 left-4 w-24 opacity-90" aria-hidden>
        <svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="60" cy="118" rx="34" ry="14" fill="#c4785a" />
          <rect x="30" y="90" width="60" height="30" rx="8" fill="#c4785a" />
          <circle cx="48" cy="104" r="2" fill="#5d4037" />
          <circle cx="72" cy="104" r="2" fill="#5d4037" />
          <path d="M45 112 Q60 118 75 112" stroke="#5d4037" strokeWidth="2" fill="none" />
          <ellipse cx="60" cy="70" rx="28" ry="36" fill="#6b9e6e" />
          <circle cx="72" cy="40" r="6" fill="#d45a5a" />
          <line x1="45" y1="55" x2="38" y2="48" stroke="#3e5e40" />
          <line x1="75" y1="60" x2="84" y2="52" stroke="#3e5e40" />
        </svg>
      </div>
      <div className="pointer-events-none fixed bottom-4 right-4 w-28 opacity-90" aria-hidden>
        <svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="70" cy="60" rx="50" ry="28" fill="#f5f0e6" stroke="#5d4037" strokeWidth="2" />
          <ellipse cx="40" cy="48" rx="16" ry="14" fill="#3e2723" />
          <ellipse cx="95" cy="55" rx="14" ry="12" fill="#c4785a" />
          <circle cx="55" cy="52" r="2" fill="#5d4037" />
          <circle cx="75" cy="52" r="2" fill="#5d4037" />
          <path d="M58 62 Q65 66 72 62" stroke="#5d4037" fill="none" />
        </svg>
      </div>
    </>
  );
}
