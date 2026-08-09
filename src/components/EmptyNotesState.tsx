/** Empty home illustration — matches challenge video empty state (frame_021). */

export function EmptyNotesState() {
  return (
    <div
      className="flex min-h-72 flex-col items-center justify-center gap-4 px-4 py-12 text-center"
      data-testid="empty-notes"
    >
      <div className="w-36 opacity-95" aria-hidden>
        <svg viewBox="0 0 160 180" xmlns="http://www.w3.org/2000/svg">
          {/* straw */}
          <rect x="98" y="18" width="10" height="70" rx="3" fill="#5d4037" />
          {/* sparkles */}
          <circle cx="48" cy="36" r="4" fill="#c4785a" opacity="0.55" />
          <circle cx="128" cy="48" r="3" fill="#c4785a" opacity="0.45" />
          <circle cx="40" cy="58" r="2.5" fill="#8d6e63" opacity="0.4" />
          {/* cup body */}
          <path
            d="M42 70 C40 70 38 72 38 78 L48 158 C49 164 54 168 60 168 L100 168 C106 168 111 164 112 158 L122 78 C122 72 120 70 118 70 Z"
            fill="#e8d5c4"
            stroke="#5d4037"
            strokeWidth="2.5"
          />
          {/* drink */}
          <path
            d="M46 98 L52 152 C53 156 56 158 60 158 L100 158 C104 158 107 156 108 152 L114 98 Z"
            fill="#c4785a"
          />
          {/* boba pearls */}
          <circle cx="62" cy="148" r="6" fill="#3e2723" />
          <circle cx="80" cy="150" r="6.5" fill="#3e2723" />
          <circle cx="96" cy="147" r="5.5" fill="#3e2723" />
          <circle cx="72" cy="138" r="5" fill="#4e342e" />
          {/* foam top */}
          <ellipse
            cx="80"
            cy="78"
            rx="40"
            ry="16"
            fill="#f5f0e6"
            stroke="#5d4037"
            strokeWidth="2"
          />
          <ellipse
            cx="62"
            cy="74"
            rx="12"
            ry="10"
            fill="#f5f0e6"
            stroke="#5d4037"
            strokeWidth="1.5"
          />
          <ellipse
            cx="98"
            cy="74"
            rx="11"
            ry="9"
            fill="#f5f0e6"
            stroke="#5d4037"
            strokeWidth="1.5"
          />
          {/* face */}
          <path
            d="M64 108 Q68 112 72 108"
            stroke="#5d4037"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M88 108 Q92 112 96 108"
            stroke="#5d4037"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M76 118 Q80 122 84 118"
            stroke="#5d4037"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="max-w-xs text-base text-[var(--ink)]">
        I&apos;m just here waiting for your charming notes...
      </p>
    </div>
  );
}
